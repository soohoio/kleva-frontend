import React from 'react'
import { Subject, BehaviorSubject, forkJoin } from 'rxjs'
import { distinctUntilChanged, switchMap, takeUntil, tap } from 'rxjs/operators'
import BigNumber from 'bignumber.js'

import { STRATEGIES } from 'constants/address'
import { addCollateral$, borrowMore$, addPosition$, approve$, caver, getOpenPositionResult$, getOutputTokenAmount$, getPositionValue$, getTransactionReceipt$, getPositionValue_kokonut$, getOpenPositionResult_kokonut$ } from '../../streams/contract'
import { fetchWalletInfo$ } from '../../streams/wallet'
import { MAX_UINT } from 'constants/setting'
import { lendingPoolsByStakingTokenAddress } from '../../constants/lendingpool'
import { debtTokens, getIbTokenFromOriginalToken, tokenList } from '../../constants/tokens'
import { closeContentView$, closeModal$, openModal$ } from '../../streams/ui'
import { showDetailDefault$, showSummaryDefault$, slippage$ } from '../../streams/setting'
import { klevaAnnualRewards$, poolReserves$, fetchPositions$, klayswapPoolInfo$ } from '../../streams/farming'
import { calcKlevaRewardsAPR, getBufferedLeverage, getLPAmountBasedOnIngredientsToken, getOptimalAmount, optimalDeposit } from '../../utils/calc'
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
    this.baseToken$ = new BehaviorSubject(this.borrowingAsset$.value)

    const baseTokenNum = this.tokens.findIndex((t) => isSameAddress(t.address, this.borrowingAsset$.value.address)) + 1
    this.baseTokenNum$ = new BehaviorSubject(baseTokenNum)

    this.otherTokens$ = new BehaviorSubject([])

    this.worker$ = new BehaviorSubject()

    this.token1Amount$ = new BehaviorSubject('')
    this.token2Amount$ = new BehaviorSubject('')
    this.token3Amount$ = new BehaviorSubject('')
    this.token4Amount$ = new BehaviorSubject('')

    this.isToken1Focused$ = new BehaviorSubject(false)
    this.isToken2Focused$ = new BehaviorSubject(false)
    this.isToken3Focused$ = new BehaviorSubject(false)
    this.isToken4Focused$ = new BehaviorSubject(false)

    this.resultTokensAmount$ = new BehaviorSubject(this.tokens.map(() => 0))
    this.lpChangeRatio$ = new BehaviorSubject(0)
    this.isLpGain$ = new BehaviorSubject(false)
    this.resultNewLpAmount$ = new BehaviorSubject(0)

    this.outputAmount$ = new BehaviorSubject()
    this.expectedLpAmount$ = new BehaviorSubject()
    this.allowances$ = new BehaviorSubject({})
    this.leverage$ = new BehaviorSubject(this.comp.props.currentPositionLeverage)
    this.addCollateralAvailable$ = new BehaviorSubject(true)
    this.borrowMoreAvailable$ = new BehaviorSubject(true)
    this.isDebtSizeValid$ = new BehaviorSubject(true)

    // finalPositionIngredientBaseTokenAmount, finalPositionIngredientFarmingTokenAmount
    this.before_baseAmount$ = new BehaviorSubject('')
    this.positionValue$ = new BehaviorSubject(0)
    this.before_positionValue$ = new BehaviorSubject(this.comp.props.positionValue)
    this.before_health$ = new BehaviorSubject(this.comp.props.health)
    this.before_debtAmount$ = new BehaviorSubject(this.comp.props.debtValue)
    this.before_equityValue$ = new BehaviorSubject(this.comp.props.equityValue)

    this.before_leverage = this.comp.props.currentPositionLeverage
    this.newDebtValue$ = new BehaviorSubject(0)

    this.finalCalculatedLeverage$ = new BehaviorSubject()

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
        this.token1Amount$.next('')
        this.token2Amount$.next('')
        this.token3Amount$.next('')
        this.token4Amount$.next('')
        this.leverage$.next(this.comp.props.currentPositionLeverage)
        this.newDebtValue$.next('')
        this.addCollateralAvailable$.next(true)
        this.borrowMoreAvailable$.next(true)
      }),
      takeUntil(this.comp.destroy$)
    ).subscribe()
  }

  getTokens = () => {
    const ibToken = getIbTokenFromOriginalToken(this.borrowingAsset$.value)

    const baseToken = this.tokens.find((t) => isSameAddress(this.borrowingAsset$.value?.address, t.address))

    return {
      tokens: this.tokens,
      ibToken,
      otherTokens: this.tokens.filter((t) => !isSameAddress(baseToken.address, t.address)),
      baseToken,
    }
  }

  getConfig = () => {
    const { workerInfo } = this.comp.props

    const leverageCap = getBufferedLeverage(workerInfo?.workFactorBps)

    const workFactorBps = workerInfo?.workFactorBps
    const rawKillFactorBps = workerInfo?.rawKillFactorBps

    return { workerInfo, workFactorBps, rawKillFactorBps, leverageCap }
  }

  getAmountToBorrow = () => {
    if (!this.borrowMore$.value) return 0

    let leverage = this.leverage$.value

    // @HACK This code resolves Klayswap error: Klayswap contract reverts transaction when there is 0 amount to swap.
    // if (Number(leverage) >= 1.999 && Number(leverage) <= 2.001) {
    //   leverage = 1.999
    // }

    const amountToBeBorrowed = new BigNumber(this.before_equityValue$.value)
      .multipliedBy(Number(leverage) - Number(this.before_leverage))
      .toFixed(0)

    return amountToBeBorrowed
  }

  getBaseTokenAmount = () => {
    return this[`token${this.baseTokenNum$.value}Amount$`].value || 0
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
      borrowingDelta: new BigNumber(this.getAmountToBorrow()).div(10 ** this.baseToken$.value?.decimals).toNumber()
    })
  }

  getTokenAmountsPure = () => {
    const { token1Amt, token2Amt, token3Amt, token4Amt } = this.comp.props

    const token1Amount = new BigNumber(this.token1Amount$.value || 0)
      .plus(token1Amt || 0)
      .multipliedBy(10 ** this.token1?.decimals)
      .toString()

    const token2Amount = new BigNumber(this.token2Amount$.value || 0)
      .plus(token2Amt || 0)
      .multipliedBy(10 ** this.token2?.decimals)
      .toString()

    const token3Amount = new BigNumber(this.token3Amount$.value || 0)
      .plus(token3Amt || 0)
      .multipliedBy(10 ** this.token3?.decimals)
      .toString()

    const token4Amount = new BigNumber(this.token4Amount$.value || 0)
      .plus(token4Amt || 0)
      .multipliedBy(10 ** this.token4?.decimals)
      .toString()

    const _tokenAmounts = [
      token1Amount,
      token2Amount,
      token3Amount,
      token4Amount,
    ]

    const tokenAmounts = this.tokens.map((t, idx) => _tokenAmounts[idx] || 0)
    
    const newTokenInputAmounts = this.tokens.map((t, idx) => {
      return new BigNumber(this[`token${idx + 1}Amount$`].value || 0)
        .multipliedBy(10 ** this[`token${idx + 1}`].decimals)
        .toFixed(0)
    })

    const borrowIncludedTokenAmounts = this.tokens
      .map((t, idx) => {
        const num = idx + 1
        if (num == this.baseTokenNum$.value) {
          return new BigNumber(tokenAmounts[idx] || 0)
            .plus(this.getAmountToBorrow())
            .toString()
        }

        return new BigNumber(tokenAmounts[idx] || 0)
          .toString()
      })

    const baseTokenAmount = new BigNumber(this.getBaseTokenAmount())
      .multipliedBy(10 ** this.baseToken$.value.decimals)
      .toString()

    return {
      token1Amount,
      token2Amount,
      token3Amount,
      token4Amount,
      baseTokenAmount,
      newTokenInputAmounts,
      tokenAmounts,
      borrowIncludedTokenAmounts,
    }
  }

  getOpenPositionResult$ = () => {
    const { workerInfo, positionId } = this.comp.props

    const { token1Amount, token2Amount, token3Amount, token4Amount, tokenAmounts, baseTokenAmount, borrowIncludedTokenAmounts, newTokenInputAmounts } = this.getTokenAmountsPure()

    return forkJoin([
      getOpenPositionResult_kokonut$({
        workerAddress: workerInfo.workerAddress,
        tokenAmounts: newTokenInputAmounts,
        positionId
      }),
      getPositionValue_kokonut$({
        workerAddress: workerInfo.workerAddress,
        tokenAmounts: borrowIncludedTokenAmounts,
      })
    ]).pipe(
      tap(([ openPositionResult, positionValue ]) => {

        this.positionValue$.next(positionValue)

        console.log(openPositionResult, 'openPositionResult')

        this.resultTokensAmount$.next(openPositionResult.receiveTokensAmt)
        this.resultNewLpAmount$.next(openPositionResult.receiveLpAmt)

        const isLpGain = new BigNumber(openPositionResult.receiveLpAmt)
          .gt(openPositionResult.lpAmtOnBalanced)

        const lpChangeRatio = isLpGain
          ? new BigNumber(openPositionResult.receiveLpAmt)
            .div(openPositionResult.lpAmtOnBalanced)
            .minus(1)
            .toNumber()
          : new BigNumber(1)
            .minus(
              new BigNumber(openPositionResult.receiveLpAmt)
                .div(openPositionResult.lpAmtOnBalanced)
            )
            .toNumber()

        this.lpChangeRatio$.next(isNaN(lpChangeRatio)
          ? 0
          : lpChangeRatio
        )

        this.isLpGain$.next(isLpGain)
      })
    )
  }

  // getValueInUSD = () => {
  //   const farmingTokenPrice = tokenPrices$.value[this.farmingToken$.value.address.toLowerCase()]
  //   const baseTokenPrice = tokenPrices$.value[this.baseToken$.value.address.toLowerCase()]

  //   const farmingInUSD = new BigNumber(this.farmingTokenAmount$.value || 0)
  //     .multipliedBy(farmingTokenPrice)
  //     .toString()

  //   const baseInUSD = new BigNumber(this.baseTokenAmount$.value || 0)
  //     .multipliedBy(baseTokenPrice)
  //     .toString()

  //   const borrowAmount = this.getAmountToBorrow()

  //   const borrowingInUSD = new BigNumber(borrowAmount || 0)
  //     .div(10 ** this.baseToken$.value?.decimals)
  //     .multipliedBy(baseTokenPrice)
  //     .toString()

  //   const totalInUSD = new BigNumber(farmingInUSD).plus(baseInUSD).plus(borrowingInUSD)

  //   return {
  //     farmingValue: new BigNumber(farmingInUSD).div(totalInUSD || 1).multipliedBy(100).toNumber(),
  //     baseValue: new BigNumber(baseInUSD)
  //       .plus(borrowingInUSD) // borrowing
  //       .div(totalInUSD || 1)
  //       .multipliedBy(100).toNumber(),
  //   }
  // }

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

  // getStrategy = () => {
  //   // FarmingTokenAmount Doesn't exist -> AddBaseTokenOnly
  //   if (this.farmingTokenAmount$.value == 0) {
  //     return { strategyType: "ADD_BASE_TOKEN_ONLY", strategyAddress: STRATEGIES["ADD_BASE_TOKEN_ONLY"] }
  //   }

  //   // FarmingTokenAmount Exists -> AddTwoSidesOptimal
  //   return { strategyType: "ADD_TWO_SIDES_OPTIMAL", strategyAddress: STRATEGIES["ADD_TWO_SIDES_OPTIMAL"] }
  // }

  getOtherTokensAmountSum = () => {
    const otherTokensAmountSum = this.tokens
      .reduce((acc, cur, idx) => {
        if (isSameAddress(cur.address, this.baseToken$.value.address))
          return acc

        acc += Number(this[`token${idx + 1}Amount$`].value)
        return acc
      }, 0)

    return otherTokensAmountSum
  }

  addCollateral = () => {
    const { vaultAddress, positionId } = this.comp.props
    
    const { tokenAmounts, newTokenInputAmounts, baseTokenAmount } = this.getTokenAmountsPure()

    const otherTokensAmountSum = this.getOtherTokensAmountSum()
    // const { strategyType, strategyAddress } = this.getStrategy()
    const { strategyType, strategyAddress } = getStrategy({
      exchange: "kokonutswap",
      strategyType: (otherTokensAmountSum == 0 && baseTokenAmount != 0)
        ? "KOKONUTSWAP:ADD_BASE_TOKEN_ONLY"
        : "KOKONUTSWAP:ADD_ALL"
    })

    const MIN_LP_AMOUNT = new BigNumber(this.resultNewLpAmount$.value)
      .multipliedBy(1 - (Number(slippage$.value) / 100))
      .toFixed(0)

    const ext = strategyType === "KOKONUTSWAP:ADD_BASE_TOKEN_ONLY"
      ? caver.klay.abi.encodeParameters(['uint256'], [MIN_LP_AMOUNT])
      : caver.klay.abi.encodeParameters(
        ['uint256[]', 'uint256'],
        [
          newTokenInputAmounts,
          MIN_LP_AMOUNT
        ])

    const data = caver.klay.abi.encodeParameters(['address', 'bytes'], [strategyAddress, ext])

    const principalAmount = baseTokenAmount

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
            <p className="CompletedModal__title">{I18n.t('farming.adjustPosition.completed.title')}</p>
          </CompletedModal>
        )
      })
    })
  }

  // Borrow more
  borrowMore = () => {
    const { vaultAddress, positionId } = this.comp.props

    const amountToBeBorrowed = this.getAmountToBorrow()

    const strategyAddress = STRATEGIES["KOKONUTSWAP:ADD_BASE_TOKEN_ONLY"]

    const MIN_LP_AMOUNT = new BigNumber(this.resultNewLpAmount$.value)
      .multipliedBy(1 - (Number(slippage$.value) / 100))
      .toFixed(0)

    console.log(this.resultNewLpAmount$.value, 'this.resultNewLpAmount$.value')
    console.log(MIN_LP_AMOUNT, 'MIN_LP_AMOUNT')

    const ext = caver.klay.abi.encodeParameters(['uint256'], [MIN_LP_AMOUNT])
    const data = caver.klay.abi.encodeParameters(['address', 'bytes'], [strategyAddress, ext])

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
            <p className="CompletedModal__title">{I18n.t('farming.adjustPosition.completed.title')}</p>
          </CompletedModal>
        )
      })
    })
  }

  getBeforeAfterValues = ({
    yieldFarmingAPRBefore,
    tradingFeeAPRBefore,
    klevaRewardsAPRBefore,
    borrowingInterestAPRBefore,
  }) => {

    const finalLeverageValue = this.finalCalculatedLeverage$.value
    const { currentPositionLeverage, baseBorrowingInterestAPR } = this.comp.props

    const before_totalAPR = new BigNumber(yieldFarmingAPRBefore)
      .plus(tradingFeeAPRBefore)
      .plus(klevaRewardsAPRBefore) // klevaRewards
      .minus(borrowingInterestAPRBefore) // borrowingInterest
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
      after_yieldFarmingAPR,
      after_tradingFeeAPR,
      after_klevaRewardsAPR,
      after_borrowingInterestAPR,
      after_totalAPR,
    }
  }
}
