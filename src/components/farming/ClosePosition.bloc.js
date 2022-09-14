import React from 'react'
import { Subject, BehaviorSubject, forkJoin } from 'rxjs'
import { distinctUntilChanged, switchMap, takeUntil, tap } from 'rxjs/operators'
import BigNumber from 'bignumber.js'

import { STRATEGIES } from 'constants/address'
import { 
  getCloseMinimizeResult$,
  getCloseBaseOnlyResult$,
  addCollateral$, borrowMore$, addPosition$, approve$, caver, getOpenPositionResult$, getOutputTokenAmount$, getPositionValue$, getTransactionReceipt$, convertToBaseToken$, minimizeTrading$, getPartialCloseMinimizeResult$, getPartialCloseBaseOnlyResult$, partialMinimizeTrading$, partialCloseLiquidate$ } from '../../streams/contract'
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
    this.closingMethod$ = new BehaviorSubject('minimizeTrading')

    this.entirelyClose$ = new BehaviorSubject(true)
    this.partialCloseAvailable$ = new BehaviorSubject({})

    this.partialCloseRatio$ = new BehaviorSubject(0)
    this.repayDebtRatio$ = new BehaviorSubject(0)
    this.debtRepaymentAmount$ = new BehaviorSubject(0)
    this.repayPercentageLimit$ = new BehaviorSubject()
    this.receiveBaseTokenAmt$ = new BehaviorSubject()
    this.receiveFarmTokenAmt$ = new BehaviorSubject()
    this.amountToTrade$ = new BehaviorSubject()
    this.tokenOutAmount$ = new BehaviorSubject()
    this.priceImpactBps$ = new BehaviorSubject()
    this.priceImpactBpsWithoutFee$ = new BehaviorSubject()

    this.updatedPositionValue$ = new BehaviorSubject()
    this.updatedHealth$ = new BehaviorSubject()
    this.updatedDebtAmt$ = new BehaviorSubject()

    this.lpAmount$ = new BehaviorSubject(0)
    this.lpShare$ = new BehaviorSubject(0)

    this.newUserBaseTokenAmount$ = new BehaviorSubject(0)
    this.newUserFarmingTokenAmount$ = new BehaviorSubject(0)
    
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
        this.receiveFarmTokenAmt$.next(0)
        this.amountToTrade$.next(0)
        this.tokenOutAmount$.next(0)
        this.priceImpactBps$.next(0)
        this.priceImpactBpsWithoutFee$.next(0)
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

  getOpenPositionResult$ = () => {
    const { workerInfo } = this.comp.props

    const baseTokenAmount = new BigNumber(this.baseTokenAmount$.value || 0)
      .multipliedBy(10 ** this.baseToken$.value.decimals)
      .toString() || "0"

    const leveragedBaseTokenAmount = new BigNumber(baseTokenAmount || 0)
      // .plus(this.getAmountToBorrow() || 0)
      .plus(this.newDebtValue$.value || 0)
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
            <p className="CompletedModal__title">{I18n.t('farming.closePosition.completed.title')}</p>
          </CompletedModal>
        )
      })
    })
  }

  convertToBaseToken = () => {
    const { positionId, workerInfo, vaultAddress } = this.comp.props

    const strategyAddress = STRATEGIES["LIQUIDATE_STRATEGY"]

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

  minimizeTrading = () => {
    const { positionId, vaultAddress } = this.comp.props

    const strategyAddress = STRATEGIES["MINIMIZE_TRADING_STRATEGY"]

    const MIN_FARMING_TOKEN_AMOUNT = new BigNumber(this.receiveFarmTokenAmt$.value)
      .multipliedBy(1 - (Number(slippage$.value) / 100))
      .toFixed(0)

    const ext = caver.klay.abi.encodeParameters(['uint256'], [MIN_FARMING_TOKEN_AMOUNT])
    const data = caver.klay.abi.encodeParameters(
      ['address', 'bytes'],
      [strategyAddress, ext]
    )

    minimizeTrading$(vaultAddress, {
      positionId,
      data,
    }).pipe(
      tap(() => this.isLoading$.next(true)),
      switchMap((result) => getTransactionReceipt$(result && result.result || result.tx_hash))
    ).subscribe((result) => {
      fetchWalletInfo$.next(true)
      fetchPositions$.next(true)
      this.isLoading$.next(false)
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
      if (this.closingMethod$.value === 'minimizeTrading') {
        getCloseMinimizeResult$({
          workerAddress,
          positionId
        }).pipe(
          tap(({
            receiveFarmTokenAmt,
            receiveBaseTokenAmt,
            amountToTrade,
            tokenOutAmount,
            priceImpactBps,
            priceImpactBpsWithoutFee,
          }) => {

            this.receiveBaseTokenAmt$.next(receiveBaseTokenAmt)
            this.receiveFarmTokenAmt$.next(receiveFarmTokenAmt)
            this.amountToTrade$.next(amountToTrade)
            this.tokenOutAmount$.next(tokenOutAmount)
            this.priceImpactBps$.next(priceImpactBps)
            this.priceImpactBpsWithoutFee$.next(priceImpactBpsWithoutFee)
  
          })
        ).subscribe()
      }
  
      if (this.closingMethod$.value === 'convertToBaseToken') {
  
        getCloseBaseOnlyResult$({
          workerAddress,
          positionId,
        }).pipe(
          tap(({
            receiveBaseTokenAmt,
            amountToTrade,
            tokenOutAmount,
            priceImpactBps,
            priceImpactBpsWithoutFee,
          }) => {
  
            this.receiveBaseTokenAmt$.next(receiveBaseTokenAmt)
            this.receiveFarmTokenAmt$.next(0)
            this.amountToTrade$.next(amountToTrade)
            this.tokenOutAmount$.next(tokenOutAmount)
            this.priceImpactBps$.next(priceImpactBps)
            this.priceImpactBpsWithoutFee$.next(priceImpactBpsWithoutFee)
          }),
        ).subscribe()
      }
      return
    }

    // partial close
    const MAX_LP_TOKEN_TO_LIQUIDATE = new BigNumber(this.lpAmount$.value)
      .multipliedBy(this.partialCloseRatio$.value / 100)
      .toFixed(0)

    const MAX_DEBT_REPAYMENT = new BigNumber(this.debtRepaymentAmount$.value)
      .toFixed(0)

    const methodToCall$ = this.closingMethod$.value === 'convertToBaseToken'
      ? getPartialCloseBaseOnlyResult$({
        workerAddress,
        positionId,
        closedLpAmt: MAX_LP_TOKEN_TO_LIQUIDATE,
        debtToRepay: MAX_DEBT_REPAYMENT,
      })
      : getPartialCloseMinimizeResult$({
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
        receiveFarmTokenAmt,
        amountToTrade,

        tokenOutAmount,
        priceImpactBps,
        priceImpactBpsWithoutFee,
      }) => {
        this.updatedPositionValue$.next(updatedPositionValue)
        this.updatedHealth$.next(updatedHealth)
        this.updatedDebtAmt$.next(updatedDebtAmt)
        this.receiveBaseTokenAmt$.next(receiveBaseTokenAmt)
        this.receiveFarmTokenAmt$.next(receiveFarmTokenAmt)
        this.amountToTrade$.next(amountToTrade)

        this.tokenOutAmount$.next(tokenOutAmount)
        this.priceImpactBps$.next(priceImpactBps)
        this.priceImpactBpsWithoutFee$.next(priceImpactBpsWithoutFee)
      })
    ).subscribe()
  }

  partialConvertToBaseToken = () => {
    const { vaultAddress, positionId } = this.comp.props

    const strategyAddress = STRATEGIES["PARTIAL_LIQUIDATE_STRATEGY"]

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

  partialMinimizeTrading = () => {
    const { vaultAddress, positionId } = this.comp.props

    const strategyAddress = STRATEGIES["PARTIAL_MINIMIZE_TRADING_STRATEGY"]

    const MAX_LP_TOKEN_TO_LIQUIDATE = new BigNumber(this.lpAmount$.value)
      .multipliedBy(this.partialCloseRatio$.value / 100)
      .toFixed(0)

    const MAX_DEBT_REPAYMENT = new BigNumber(this.debtRepaymentAmount$.value)
      .toFixed(0)

    const MIN_FARMING_TOKEN_AMOUNT = new BigNumber(this.receiveFarmTokenAmt$.value)
      .multipliedBy(1 - (Number(slippage$.value) / 100))
      .toFixed(0)

    const ext = caver.klay.abi.encodeParameters(['uint256', 'uint256', 'uint256'], [
      MAX_LP_TOKEN_TO_LIQUIDATE,
      MAX_DEBT_REPAYMENT,
      MIN_FARMING_TOKEN_AMOUNT,
    ])

    const data = caver.klay.abi.encodeParameters(['address', 'bytes'], [strategyAddress, ext])

    partialMinimizeTrading$(vaultAddress, {
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
      if (this.closingMethod$.value === "convertToBaseToken") {
        this.convertToBaseToken()
        return
      }

      if (this.closingMethod$.value === "minimizeTrading") {
        this.minimizeTrading()
        return
      }
    }

    // Partial Close
    if (this.closingMethod$.value === "convertToBaseToken") {
      console.log("partialConvertToBaseToken")
      this.partialConvertToBaseToken()
      return
    }

    if (this.closingMethod$.value === "minimizeTrading") {
      console.log("partialMinimizeTrading")
      this.partialMinimizeTrading()
      return
    }
  }

  getBeforeAfterValues = ({
    yieldFarmingAPRBefore,
    tradingFeeAPRBefore,
    klevaRewardsAPRBefore,
    borrowingInterestAPRBefore,
  }) => {

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

    const after_borrowingInterestAPR = new BigNumber(borrowingInterestAPRBefore)
      .multipliedBy(finalLeverageValue - 1)
      .div(currentPositionLeverage - 1)
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
