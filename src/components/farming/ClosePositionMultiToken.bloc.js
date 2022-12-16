import React from 'react'
import { Subject, BehaviorSubject, forkJoin } from 'rxjs'
import { distinctUntilChanged, switchMap, takeUntil, tap } from 'rxjs/operators'
import BigNumber from 'bignumber.js'

import { STRATEGIES } from 'constants/address'
import {
  getCloseMinimizeResult$,
  getCloseBaseOnlyResult$,
  addCollateral$, borrowMore$, addPosition$, approve$, caver, getOpenPositionResult$, getOutputTokenAmount$, getPositionValue$, getTransactionReceipt$, convertToBaseToken$, getPartialCloseMinimizeResult$, getPartialCloseBaseOnlyResult$, partialMinimizeTrading$, partialCloseLiquidate$, getCloseBaseOnlyResult_kokonut$, getPartialCloseBaseOnlyResult_kokonut$
} from '../../streams/contract'
import { fetchWalletInfo$ } from '../../streams/wallet'
import { MAX_UINT } from 'constants/setting'
import { lendingPoolsByStakingTokenAddress } from '../../constants/lendingpool'
import { debtTokens, getIbTokenFromOriginalToken, tokenList } from '../../constants/tokens'
import { closeContentView$, closeModal$, openModal$ } from '../../streams/ui'
import { showDetailDefault$, showSummaryDefault$, slippage$ } from '../../streams/setting'
import { klevaAnnualRewards$, poolReserves$, fetchPositions$, klayswapPoolInfo$ } from '../../streams/farming'
import { calcKlevaRewardsAPR, getBufferedLeverage, getLPAmountBasedOnIngredientsToken, optimalDeposit } from '../../utils/calc'
import { addressKeyFind, isSameAddress } from '../../utils/misc'
import { tokenPrices$ } from '../../streams/tokenPrice'
import { lendingTokenSupplyInfo$ } from '../../streams/vault'
import CompletedModal from '../common/CompletedModal'
import { currentTab$ } from '../../streams/view'
import { I18n } from '../common/I18n'
import { getStrategy } from '../../constants/strategy'


export default class {
  constructor(comp) {
    this.comp = comp

    this.token1 = comp.props.token1
    this.token2 = comp.props.token2
    this.token3 = comp.props.token3
    this.token4 = comp.props.token4

    this.tokens = [this.token1, this.token2, this.token3, this.token4].filter((a) => !!a)

    this.lpToken = comp.props.lpToken
    this.workerList = comp.props.workerList

    this.isLoading$ = new BehaviorSubject()
    this.borrowingAsset$ = new BehaviorSubject(comp.props.baseToken)

    // this.worker$
    this.baseToken$ = new BehaviorSubject(comp.props.baseToken)

    const baseTokenNum = this.tokens.findIndex((t) => isSameAddress(t.address, this.borrowingAsset$.value.address)) + 1
    this.baseTokenNum$ = new BehaviorSubject(baseTokenNum)

    this.otherTokens$ = new BehaviorSubject([])

    this.newUserTokenAmount1$ = new BehaviorSubject(0)
    this.newUserTokenAmount2$ = new BehaviorSubject(0)
    this.newUserTokenAmount3$ = new BehaviorSubject(0)
    this.newUserTokenAmount4$ = new BehaviorSubject(0)

    this.worker$ = new BehaviorSubject()

    this.baseTokenAmount$ = new BehaviorSubject('')
    this.outputAmount$ = new BehaviorSubject()
    this.expectedLpAmount$ = new BehaviorSubject()
    this.allowances$ = new BehaviorSubject({})
    this.leverage$ = new BehaviorSubject(this.comp.props.currentPositionLeverage)
    this.addCollateralAvailable$ = new BehaviorSubject(true)
    this.borrowMoreAvailable$ = new BehaviorSubject(true)
    this.isDebtSizeValid$ = new BehaviorSubject(true)

    // finalPositionIngredientBaseTokenAmount, finalPositionIngredientFarmingTokenAmount
    this.before_farmingAmount$ = new BehaviorSubject('')
    this.before_baseAmount$ = new BehaviorSubject('')
    this.positionValue$ = new BehaviorSubject(0)
    this.before_positionValue$ = new BehaviorSubject(this.comp.props.positionValue)
    this.before_health$ = new BehaviorSubject(this.comp.props.health)
    this.before_debtAmount$ = new BehaviorSubject(this.comp.props.debtValue)
    this.before_equityValue$ = new BehaviorSubject(this.comp.props.equityValue)
    this.before_leverage = this.comp.props.currentPositionLeverage
    this.newDebtValue$ = new BehaviorSubject(0)

    this.fetchAllowances$ = new Subject()

    // UI
    this.showAPRDetail$ = showDetailDefault$
    this.showSummary$ = showSummaryDefault$
    this.borrowMore$ = new BehaviorSubject(false)
    this.closingMethod$ = new BehaviorSubject('convertToBaseToken')

    this.entirelyClose$ = new BehaviorSubject(true)
    this.partialCloseAvailable$ = new BehaviorSubject({})

    this.partialCloseRatio$ = new BehaviorSubject(0)
    this.repayDebtRatio$ = new BehaviorSubject(0)
    this.debtRepaymentAmount$ = new BehaviorSubject(0)
    this.repayPercentageLimit$ = new BehaviorSubject()
    this.receiveBaseTokenAmt$ = new BehaviorSubject()

    this.lpChangeRatio$ = new BehaviorSubject()

    this.updatedPositionValue$ = new BehaviorSubject()
    this.updatedHealth$ = new BehaviorSubject()
    this.updatedDebtAmt$ = new BehaviorSubject()

    this.lpAmount$ = new BehaviorSubject(0)
    this.lpShare$ = new BehaviorSubject(0)

    this.newUserLpAmount$ = new BehaviorSubject(0)

    this.finalCalculatedLeverage$ = new BehaviorSubject()
    this.newPositionValue$ = new BehaviorSubject()
    this.liquidationThreshold$ = new BehaviorSubject()

    // gauge
    this.minPartialCloseRatio$ = new BehaviorSubject(0)
    this.maxPartialCloseRatio$ = new BehaviorSubject()
    this.minRepaymentDebtRatio$ = new BehaviorSubject()
    this.maxRepaymentDebtRatio$ = new BehaviorSubject()

    this.dirty$ = new BehaviorSubject()

    this.init()
  }

  init = () => {
    const { workerInfo, defaultWorker } = this.comp.props
    const leverageCap = getBufferedLeverage(workerInfo?.workFactorBps)

    this.leverage$.next(this.comp.props.currentPositionLeverage)

    this.entirelyClose$.pipe(
      distinctUntilChanged(),
      tap(() => {
        this.partialCloseRatio$.next(0)
        this.partialCloseAvailable$.next({})
        this.partialCloseRatio$.next(0)
        this.repayDebtRatio$.next(0)
        this.debtRepaymentAmount$.next(0)
        this.repayPercentageLimit$.next(0)
        this.receiveBaseTokenAmt$.next(0)
      }),
      takeUntil(this.comp.destroy$)
    ).subscribe()
  }

  getConfig = () => {
    const { workerInfo } = this.comp.props

    const leverageCap = getBufferedLeverage(workerInfo?.workFactorBps)

    const workFactorBps = workerInfo?.workFactorBps
    const rawKillFactorBps = workerInfo?.rawKillFactorBps

    return { workerInfo, workFactorBps, rawKillFactorBps, leverageCap }
  }

  getDebtTokenKlevaRewardsAPR = (leverageValue) => {
    const lendingTokenSupplyInfo = lendingTokenSupplyInfo$.value
    const borrowingAsset = this.borrowingAsset$.value

    return calcKlevaRewardsAPR({
      tokenPrices: tokenPrices$.value,
      lendingTokenSupplyInfo,
      borrowingAsset,
      debtTokens,
      klevaAnnualRewards: klevaAnnualRewards$.value,
      klevaTokenPrice: tokenPrices$.value[tokenList.KLEVA.address.toLowerCase()],
      leverage: leverageValue,
      // borrowingDelta: new BigNumber(this.getAmountToBorrow()).div(10 ** this.baseToken$.value?.decimals).toNumber()
      borrowingDelta: new BigNumber(this.newDebtValue$.value).div(10 ** this.baseToken$.value?.decimals).toNumber()
    })
  }

  setLeverageValue = (v, leverageCapRaw, leverageLowerBound) => {
    if (v < 1) return
    if (v > leverageCapRaw) return
    if (v < Number(leverageLowerBound) - 0.1) return
    this.leverage$.next(v)
  }

  approve = (token, vaultAddress) => {
    approve$(token.address, vaultAddress, MAX_UINT).pipe(
      tap(() => this.isLoading$.next(true)),
      switchMap((result) => getTransactionReceipt$(result && result.result || result.tx_hash))
    ).subscribe((result) => {
      this.isLoading$.next(false)
      fetchWalletInfo$.next(true)

      this.fetchAllowances$.next(true)
    })
  }

  convertToBaseToken = () => {
    const { farmingToken, baseToken, positionId, workerInfo, vaultAddress } = this.comp.props

    // const strategyAddress = STRATEGIES["LIQUIDATE_STRATEGY"]
    const { strategyAddress } = getStrategy({
      exchange: "kokonutswap",
      strategyType: "KOKONUTSWAP:LIQUIDATE_STRATEGY"
    })

    const MIN_BASE_TOKEN_AMOUNT = new BigNumber(this.receiveBaseTokenAmt$.value)
      .multipliedBy(1 - (Number(slippage$.value) / 100))
      .toFixed(0)

    const ext = caver.klay.abi.encodeParameters(['uint256'], [MIN_BASE_TOKEN_AMOUNT])
    const data = caver.klay.abi.encodeParameters(['address', 'bytes'], [strategyAddress, ext])

    convertToBaseToken$(vaultAddress, {
      positionId: positionId,
      data,
    }).pipe(
      tap(() => this.isLoading$.next(true)),
      switchMap((result) => getTransactionReceipt$(result && result.result || result.tx_hash))
    ).subscribe((result) => {
      fetchWalletInfo$.next(true)
      this.isLoading$.next(false)
      fetchPositions$.next(true)

      closeContentView$.next(true)

      openModal$.next({
        component: (
          <CompletedModal menus={[
            {
              title: I18n.t('confirm'),
              onClick: () => {
                closeModal$.next(true)
              }
            },
          ]}>
            <p className="CompletedModal__title">{I18n.t('myasset.suwController.withdrawCompleted')}</p>
          </CompletedModal>
        )
      })
    })
  }

  getCloseResult = () => {
    const { positionId, workerInfo } = this.comp.props
    const workerAddress = workerInfo.workerAddress

    // entire close
    if (this.entirelyClose$.value) {
        getCloseBaseOnlyResult_kokonut$({
          workerAddress,
          positionId,
        }).pipe(
          tap(({
            receiveBaseTokenAmt,
          }) => {

            this.receiveBaseTokenAmt$.next(receiveBaseTokenAmt)
          }),
        ).subscribe()
      return
    }

    // partial close
    const MAX_LP_TOKEN_TO_LIQUIDATE = new BigNumber(this.lpAmount$.value)
      .multipliedBy(this.partialCloseRatio$.value / 100)
      .toFixed(0)

    const MAX_DEBT_REPAYMENT = new BigNumber(this.debtRepaymentAmount$.value)
      .toFixed(0)

    const methodToCall$ = getPartialCloseBaseOnlyResult_kokonut$({
      workerAddress,
      positionId,
      closedLpAmt: MAX_LP_TOKEN_TO_LIQUIDATE,
      debtToRepay: MAX_DEBT_REPAYMENT,
    })

    methodToCall$.pipe(
      tap(({
        updatedPositionValue,
        updatedHealth,
        updatedDebtAmt,
        receiveBaseTokenAmt,
      }) => {
        this.updatedPositionValue$.next(updatedPositionValue)
        this.updatedHealth$.next(updatedHealth)
        this.updatedDebtAmt$.next(updatedDebtAmt)

        this.receiveBaseTokenAmt$.next(receiveBaseTokenAmt)
      })
    ).subscribe()
  }

  partialConvertToBaseToken = () => {
    const { farmingToken, baseToken, vaultAddress, positionId } = this.comp.props

    // const strategyAddress = STRATEGIES["PARTIAL_LIQUIDATE_STRATEGY"]
    const { strategyAddress } = getStrategy({
      exchange: "kokonutswap",
      strategyType: "KOKONUTSWAP:PARTIAL_LIQUIDATE_STRATEGY"
    })

    const MAX_LP_TOKEN_TO_LIQUIDATE = new BigNumber(this.lpAmount$.value)
      .multipliedBy(this.partialCloseRatio$.value / 100)
      .toFixed(0)

    const MAX_DEBT_REPAYMENT = new BigNumber(this.debtRepaymentAmount$.value)
      .toFixed(0)

    const MIN_BASE_TOKEN_AMOUNT = new BigNumber(this.receiveBaseTokenAmt$.value)
      .multipliedBy(1 - (Number(slippage$.value) / 100))
      .toFixed(0)

    const ext = caver.klay.abi.encodeParameters(['uint256', 'uint256', 'uint256'], [
      MAX_LP_TOKEN_TO_LIQUIDATE,
      MAX_DEBT_REPAYMENT,
      MIN_BASE_TOKEN_AMOUNT,
    ])
    const data = caver.klay.abi.encodeParameters(['address', 'bytes'], [strategyAddress, ext])

    partialCloseLiquidate$(vaultAddress, {
      positionId,
      maxDebtRepayment: MAX_DEBT_REPAYMENT,
      data,
    }).pipe(
      tap(() => this.isLoading$.next(true)),
      switchMap((result) => getTransactionReceipt$(result && result.result || result.tx_hash)),
      tap(() => {
        this.isLoading$.next(false)
        fetchWalletInfo$.next(true)
        fetchPositions$.next(true)
        closeContentView$.next(true)

        openModal$.next({
          component: (
            <CompletedModal menus={[
              {
                title: I18n.t('confirm'),
                onClick: () => {
                  closeModal$.next(true)
                }
              },
            ]}>
              <p className="CompletedModal__title">{I18n.t('farming.closePosition.completed.title')}</p>
            </CompletedModal>
          )
        })
      })
    ).subscribe()
  }

  closePosition = () => {
    // Entire Close
    if (this.entirelyClose$.value) {
      this.convertToBaseToken()
      return
    }

    // Partial Close
    if (this.closingMethod$.value === "convertToBaseToken") {
      this.partialConvertToBaseToken()
      return
    }
  }

  getBeforeAfterValues = ({
    yieldFarmingAPRBefore,
    tradingFeeAPRBefore,
    klevaRewardsAPRBefore,
    borrowingInterestAPRBefore,
  }) => {

    const { baseBorrowingInterestAPR } = this.comp.props

    const finalLeverageValue = this.finalCalculatedLeverage$.value
    const { currentPositionLeverage } = this.comp.props

    const before_totalAPR = new BigNumber(yieldFarmingAPRBefore)
      .plus(tradingFeeAPRBefore)
      .plus(klevaRewardsAPRBefore) // klevaRewards
      .minus(borrowingInterestAPRBefore) // borrowingInterest
      .toNumber()

    const before_debtRatio = new BigNumber(this.before_debtAmount$.value)
      .div(this.before_positionValue$.value)
      .multipliedBy(100)
      .toNumber()

    const after_debtRatio = new BigNumber(this.newDebtValue$.value)
      .div(this.newPositionValue$.value)
      .multipliedBy(100)
      .toNumber()

    const after_yieldFarmingAPR = new BigNumber(yieldFarmingAPRBefore)
      .multipliedBy(finalLeverageValue)
      .div(currentPositionLeverage)
      .toNumber()

    const after_tradingFeeAPR = new BigNumber(tradingFeeAPRBefore)
      .multipliedBy(finalLeverageValue)
      .div(currentPositionLeverage)
      .toNumber()

    const after_klevaRewardsAPR = this.getDebtTokenKlevaRewardsAPR(finalLeverageValue)

    const after_borrowingInterestAPR = new BigNumber(baseBorrowingInterestAPR)
      .multipliedBy(finalLeverageValue - 1)
      .toNumber()

    const after_totalAPR = new BigNumber(after_yieldFarmingAPR)
      .plus(after_tradingFeeAPR)
      .plus(after_klevaRewardsAPR) // klevaRewards
      .minus(after_borrowingInterestAPR) // borrowingInterest
      .toNumber()

    return {
      before_totalAPR,
      before_debtRatio,
      after_debtRatio,
      after_yieldFarmingAPR,
      after_tradingFeeAPR,
      after_klevaRewardsAPR,
      after_borrowingInterestAPR,
      after_totalAPR,
    }
  }
}
