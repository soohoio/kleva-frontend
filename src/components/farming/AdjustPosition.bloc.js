import React from 'react'
import { Subject, BehaviorSubject, forkJoin } from 'rxjs'
import { distinctUntilChanged, switchMap, takeUntil, tap } from 'rxjs/operators'
import BigNumber from 'bignumber.js'

import { STRATEGIES } from 'constants/address'
import { addCollateral$, borrowMore$, addPosition$, approve$, caver, getOpenPositionResult$, getOutputTokenAmount$, getPositionValue$, getTransactionReceipt$ } from '../../streams/contract'
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

export default class {
  constructor(comp) {
    this.comp = comp

    this.lpToken = comp.props.lpToken
    this.workerList = comp.props.workerList

    this.isLoading$ = new BehaviorSubject()
    this.borrowingAsset$ = new BehaviorSubject(comp.props.baseToken)

    // this.worker$
    this.farmingToken$ = new BehaviorSubject(comp.props.farmingToken)
    this.baseToken$ = new BehaviorSubject(comp.props.baseToken)

    this.worker$ = new BehaviorSubject()

    this.farmingTokenAmount$ = new BehaviorSubject('')
    this.baseTokenAmount$ = new BehaviorSubject('')
    this.priceImpact$ = new BehaviorSubject('')
    this.leverageImpact$ = new BehaviorSubject('')
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
    this.resultBaseTokenAmount$ = new BehaviorSubject()
    this.resultFarmTokenAmount$ = new BehaviorSubject()
    this.positionValue$ = new BehaviorSubject(0)
    this.before_positionValue$ = new BehaviorSubject(0)
    this.before_health$ = new BehaviorSubject(0)
    this.before_debtAmount$ = new BehaviorSubject(0)
    this.before_equityValue$ = new BehaviorSubject(0)
    this.before_leverage = this.comp.props.currentPositionLeverage
    this.newDebtValue$ = new BehaviorSubject(0)

    // ex) Farming Token: 10 KSP, Base Token: 100 KLEVA
    // Convert 10 KSP to [farmingTokenAmountInBaseToken] KLEVA.
    this.farmingTokenAmountInBaseToken$ = new BehaviorSubject()
    this.afterPositionValue$ = new BehaviorSubject()

    this.fetchAllowances$ = new Subject()

    // UI
    this.showAPRDetail$ = showDetailDefault$
    this.showSummary$ = showSummaryDefault$
    this.borrowMore$ = new BehaviorSubject(false)

    this.init()
  }

  init = () => {
    const { workerInfo, defaultWorker } = this.comp.props
    const leverageCap = getBufferedLeverage(workerInfo?.workFactorBps)

    this.leverage$.next(this.comp.props.currentPositionLeverage)

    this.borrowMore$.pipe(
      distinctUntilChanged(),
      tap(() => {
        // Reset all
        this.farmingTokenAmount$.next('')
        this.baseTokenAmount$.next('')
        // this.farmingTokenAmountInBaseToken$.next('')
        this.leverage$.next(this.comp.props.currentPositionLeverage)
        // this.before_userFarmingTokenAmount$.next('')
        // this.before_userBaseTokenAmount$.next('')
        // this.newEquityValue$.next('')
        this.newDebtValue$.next('')
        // this.newPositionValue$.next('')
        // this.amountToBeBorrowed$.next('')
        this.addCollateralAvailable$.next(true)
        this.borrowMoreAvailable$.next(true)
        this.priceImpact$.next('')
        // this.finalPositionIngredientBaseTokenAmount$.next('')
        // this.finalPositionIngredientFarmingTokenAmount$.next('')
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

  getBeforeAfter = () => {
    const before_yieldFarmingAPR = this.comp.props.yieldFarmingAPR
    const before_tradingFeeAPR = this.comp.props.tradingFeeAPR
    const before_klevaRewardsAPR = this.comp.props.klevaRewardAPR
    const before_borrowingInterestAPR = this.comp.props.borrowingInterestAPRBefore

    const before_totalAPR = new BigNumber(before_yieldFarmingAPR)
      .plus(before_tradingFeeAPR)
      .plus(before_klevaRewardsAPR) // klevaRewards
      .minus(before_borrowingInterestAPR) // borrowingInterest
      .toNumber()

    // APR After
    const after_yieldFarmingAPR = new BigNumber(before_yieldFarmingAPR)
      .multipliedBy(this.leverage$.value)
      .toNumber()

    const after_tradingFeeAPR = new BigNumber(before_tradingFeeAPR)
      .multipliedBy(this.leverage$.value)
      .toNumber()

    const after_klevaRewardsAPR = this.getDebtTokenKlevaRewardsAPR()

    const borrowingInfo = lendingTokenSupplyInfo$.value && lendingTokenSupplyInfo$.value[this.borrowingAsset$.value && this.borrowingAsset$.value.address.toLowerCase()]

    const after_borrowingInterestAPR = borrowingInfo
      && new BigNumber(borrowingInfo.borrowingInterest)
        .multipliedBy(this.leverage$.value - 1)
        .toNumber()

    const after_totalAPR = new BigNumber(after_yieldFarmingAPR)
      .plus(after_tradingFeeAPR)
      .plus(after_klevaRewardsAPR)
      .minus(after_borrowingInterestAPR)
      .toNumber()

    // console.log(before_yieldFarmingAPR, 'before_yieldFarmingAPR')
    // console.log(before_tradingFeeAPR, 'before_tradingFeeAPR')
    // console.log(before_klevaRewardsAPR, 'before_klevaRewardsAPR')
    // console.log(before_borrowingInterestAPR, 'before_borrowingInterestAPR')
    // console.log(before_totalAPR, 'before_totalAPR')
    // console.log(after_yieldFarmingAPR, 'after_yieldFarmingAPR')
    // console.log(after_tradingFeeAPR, 'after_tradingFeeAPR')
    // console.log(after_klevaRewardsAPR, 'after_klevaRewardsAPR')
    // console.log(borrowingInfo, 'borrowingInfo')
    // console.log(after_borrowingInterestAPR, 'after_borrowingInterestAPR')
    // console.log(after_totalAPR, 'after_totalAPR')

    return {
      before_totalAPR,
      after_yieldFarmingAPR,
      after_tradingFeeAPR,
      after_klevaRewardsAPR,
      borrowingInfo,
      after_borrowingInterestAPR,
      after_totalAPR,
    }
  }

  getAmountToBorrow = () => {
    if (!this.borrowMore$.value) return 0

    const amountToBeBorrowed = new BigNumber(this.before_equityValue$.value)
      .multipliedBy(Number(this.leverage$.value) - Number(this.before_leverage))
      .toFixed(0)

    console.log(Number(this.leverage$.value), 'Number(this.leverage$.value)')
    console.log(Number(this.before_leverage), 'Number(this.before_leverage)')

    return amountToBeBorrowed
  }

  getDebtTokenKlevaRewardsAPR = () => {
    const lendingTokenSupplyInfo = lendingTokenSupplyInfo$.value
    const borrowingAsset = this.borrowingAsset$.value

    return calcKlevaRewardsAPR({
      tokenPrices: tokenPrices$.value,
      lendingTokenSupplyInfo,
      borrowingAsset,
      debtTokens,
      klevaAnnualRewards: klevaAnnualRewards$.value,
      klevaTokenPrice: tokenPrices$.value[tokenList.KLEVA.address.toLowerCase()],
      leverage: this.leverage$.value,
      borrowingDelta: new BigNumber(this.getAmountToBorrow()).div(10 ** this.baseToken$.value?.decimals).toNumber()
    })
  }

  getOpenPositionResult$ = () => {
    const { workerInfo } = this.comp.props

    const baseTokenAmount = new BigNumber(this.baseTokenAmount$.value || 0)
      .multipliedBy(10 ** this.baseToken$.value.decimals)
      .toString() || "0"

    const leveragedBaseTokenAmount = new BigNumber(baseTokenAmount || 0)
      .plus(this.getAmountToBorrow() || 0)
      .plus(this.before_baseAmount$.value || 0)
      .toFixed(0) || "0"

    const farmTokenAmount = new BigNumber(this.farmingTokenAmount$.value || 0)
      .multipliedBy(10 ** this.farmingToken$.value.decimals)
      .plus(this.before_farmingAmount$.value || 0)
      .toString() || "0"

    console.log(baseTokenAmount, 'baseTokenAmount')
    console.log(leveragedBaseTokenAmount, 'leveragedBaseTokenAmount')
    console.log(farmTokenAmount, 'farmTokenAmount')

    return forkJoin([
      getOpenPositionResult$({
        workerAddress: workerInfo.workerAddress,
        leveragedBaseTokenAmount: baseTokenAmount,
        farmTokenAmount,
        positionId: 0
      }),
      getOpenPositionResult$({
        workerAddress: workerInfo.workerAddress,
        leveragedBaseTokenAmount: leveragedBaseTokenAmount,
        farmTokenAmount,
        positionId: 0
      }),
      getPositionValue$({
        workerAddress: workerInfo.workerAddress,
        baseTokenAmount: leveragedBaseTokenAmount,
        farmingTokenAmount: farmTokenAmount,
      }),
    ]).pipe(
      tap(([openPositionResult, openPositionResult_leverage, positionValue]) => {
        console.log(openPositionResult, 'openPositionResult')
        console.log(openPositionResult_leverage, 'openPositionResult_leverage')
        console.log(positionValue, 'positionValue')

        this.resultBaseTokenAmount$.next(openPositionResult_leverage.resultBaseTokenAmount)
        this.resultFarmTokenAmount$.next(openPositionResult_leverage.resultFarmTokenAmount)

        this.priceImpact$.next(new BigNumber(openPositionResult.priceImpactBps).div(10000).toString())

        this.positionValue$.next(positionValue)

        if (this.leverage$.value == 1) {
          this.leverageImpact$.next(0)
        } else {
          this.leverageImpact$.next(new BigNumber(openPositionResult_leverage.priceImpactBps).div(10000).toString())
        }
      })
    )
  }

  getValueInUSD = () => {
    const farmingTokenPrice = tokenPrices$.value[this.farmingToken$.value.address.toLowerCase()]
    const baseTokenPrice = tokenPrices$.value[this.baseToken$.value.address.toLowerCase()]

    const farmingInUSD = new BigNumber(this.farmingTokenAmount$.value || 0)
      .multipliedBy(farmingTokenPrice)
      .toString()

    const baseInUSD = new BigNumber(this.baseTokenAmount$.value || 0)
      .multipliedBy(baseTokenPrice)
      .toString()

    const totalInUSD = new BigNumber(farmingInUSD).plus(baseInUSD)

    return {
      value1: new BigNumber(farmingInUSD).div(totalInUSD || 1).multipliedBy(100).toNumber(),
      value2: new BigNumber(baseInUSD).div(totalInUSD || 1).multipliedBy(100).toNumber(),
    }
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

  getStrategy = () => {
    // FarmingTokenAmount Doesn't exist -> AddBaseTokenOnly
    if (this.farmingTokenAmount$.value == 0) {
      return { strategyType: "ADD_BASE_TOKEN_ONLY", strategyAddress: STRATEGIES["ADD_BASE_TOKEN_ONLY"] }
    }

    // FarmingTokenAmount Exists -> AddTwoSidesOptimal
    return { strategyType: "ADD_TWO_SIDES_OPTIMAL", strategyAddress: STRATEGIES["ADD_TWO_SIDES_OPTIMAL"] }
  }

  addCollateral = () => {
    const { vaultAddress, positionId } = this.comp.props
    const { strategyType, strategyAddress } = this.getStrategy()

    const baseTokenAmount = new BigNumber(this.baseTokenAmount$.value || 0)

    const poolInfo = addressKeyFind(klayswapPoolInfo$.value, this.lpToken?.address)

    const expectedLpAmount = getLPAmountBasedOnIngredientsToken({
      poolInfo,
      token1: {
        ...this.baseToken$.value,
        amount: new BigNumber(this.resultBaseTokenAmount$.value || 0)
          .toString()
      },
      token2: {
        ...this.farmingToken$.value,
        amount: new BigNumber(this.resultFarmTokenAmount$.value || 0)
          .toString()
      }
    })

    const MIN_LP_AMOUNT = new BigNumber(expectedLpAmount)
      .multipliedBy(1 - (Number(slippage$.value) / 100))
      .toFixed(0)

    const ext = strategyType === "ADD_BASE_TOKEN_ONLY"
      ? caver.klay.abi.encodeParameters(['uint256'], [MIN_LP_AMOUNT])
      : caver.klay.abi.encodeParameters(
        ['uint256', 'uint256'],
        [new BigNumber(this.farmingTokenAmount$.value || 0)
          .multipliedBy(10 ** this.farmingToken$.value.decimals)
          .toString(),
          MIN_LP_AMOUNT
        ])

    const data = caver.klay.abi.encodeParameters(['address', 'bytes'], [strategyAddress, ext])

    const principalAmount = baseTokenAmount
      .multipliedBy(10 ** this.baseToken$.value.decimals)
      .toString()

    addCollateral$(vaultAddress, {
      positionId,
      principalAmount,
      data,
    }).pipe(
      tap(() => this.isLoading$.next(true)),
      switchMap((result) => getTransactionReceipt$(result && result.result || result.tx_hash))
    ).subscribe(() => {
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
            <p className="CompletedModal__title">{I18n.t('farming.completed.title')}</p>
            <p className="CompletedModal__description">{I18n.t('farming.completed.description')}</p>
          </CompletedModal>
        )
      })
    })
  }

  // Borrow more
  borrowMore = () => {
    const { vaultAddress, positionId } = this.comp.props

    const amountToBeBorrowed = this.getAmountToBorrow()

    const strategyAddress = STRATEGIES["ADD_BASE_TOKEN_ONLY"]

    const poolInfo = addressKeyFind(klayswapPoolInfo$.value, this.lpToken?.address)
    const expectedLpAmount = getLPAmountBasedOnIngredientsToken({
      poolInfo,
      token1: {
        ...this.baseToken$.value,
        amount: new BigNumber(this.resultBaseTokenAmount$.value || 0)
          .toString()
      },
      token2: {
        ...this.farmingToken$.value,
        amount: new BigNumber(this.resultFarmTokenAmount$.value || 0)
          .toString()
      }
    })

    const MIN_LP_AMOUNT = new BigNumber(expectedLpAmount)
      .multipliedBy(1 - (Number(slippage$.value) / 100))
      .toFixed(0)
    const ext = caver.klay.abi.encodeParameters(['uint256'], [MIN_LP_AMOUNT])
    const data = caver.klay.abi.encodeParameters(['address', 'bytes'], [strategyAddress, ext])

    console.log(MIN_LP_AMOUNT, 'MIN_LP_AMOUNT')
    console.log(positionId, 'positionId')
    console.log(amountToBeBorrowed, 'amountToBeBorrowed')
    console.log(ext, 'ext')
    console.log(data, 'data')

    borrowMore$(vaultAddress, {
      positionId: positionId,
      debtAmount: amountToBeBorrowed,
      data,
    }).pipe(
      tap(() => this.isLoading$.next(true)),
      switchMap((result) => getTransactionReceipt$(result && result.result || result.tx_hash))
    ).subscribe(() => {
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
            <p className="CompletedModal__title">{I18n.t('farming.completed.title')}</p>
            <p className="CompletedModal__description">{I18n.t('farming.completed.description')}</p>
          </CompletedModal>
        )
      })
    })
  }
}
