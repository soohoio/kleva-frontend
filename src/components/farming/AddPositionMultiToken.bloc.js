import React from 'react'
import { Subject, BehaviorSubject, forkJoin } from 'rxjs'
import { switchMap, tap } from 'rxjs/operators'
import BigNumber from 'bignumber.js'

import { STRATEGIES } from 'constants/address'
import { addPosition$, approve$, caver, getOpenPositionResult$, getOpenPositionResult_kokonut$, getOutputTokenAmount$, getPositionValue$, getPositionValue_kokonut$, getTransactionReceipt$ } from '../../streams/contract'
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

    this.borrowingAsset$ = new BehaviorSubject(comp.props.defaultBorrowingAsset || comp.props.borrowingAvailableAssets[0])

    this.baseToken$ = new BehaviorSubject(this.borrowingAsset$.value)
    this.baseTokenNum$ = new BehaviorSubject(1)
    
    this.otherTokens$ = new BehaviorSubject([])

    this.worker$ = new BehaviorSubject()
    this.selectWorker(this.borrowingAsset$.value)

    this.token1Amount$ = new BehaviorSubject('')
    this.token2Amount$ = new BehaviorSubject('')
    this.token3Amount$ = new BehaviorSubject('')
    this.token4Amount$ = new BehaviorSubject('')

    // this.farmingTokenAmount$ = new BehaviorSubject('')
    // this.baseTokenAmount$ = new BehaviorSubject('')

    // this.priceImpact$ = new BehaviorSubject('')
    // this.leverageImpact$ = new BehaviorSubject('')
    this.allowances$ = new BehaviorSubject({})
    this.leverage$ = new BehaviorSubject(1)
    this.borrowMoreAvailable$ = new BehaviorSubject(true)
    this.isDebtSizeValid$ = new BehaviorSubject(true)

    this.resultTokensAmount$ = new BehaviorSubject(this.tokens.map(() => 0))
    this.lpChangeRatio$ = new BehaviorSubject(0)
    this.resultLpAmount$ = new BehaviorSubject(0)

    this.estimatedPositionValueWithoutLeverage$ = new BehaviorSubject(0)

    this.fetchAllowances$ = new Subject()
    
    this.isToken1Focused$ = new BehaviorSubject(false)
    this.isToken2Focused$ = new BehaviorSubject(false)
    this.isToken3Focused$ = new BehaviorSubject(false)
    this.isToken4Focused$ = new BehaviorSubject(false)

    this.init()
  }

  init = () => {
    this.leverage$.next(this.comp.props.defaultLeverage)
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
    const workerConfig = workerInfo
      && workerInfo[this.worker$.value.workerAddress.toLowerCase()] || workerInfo[this.worker$.value.workerAddress]

    const leverageCap = getBufferedLeverage(workerConfig.workFactorBps)

    const workFactorBps = workerConfig?.workFactorBps

    return { workerConfig, workFactorBps, leverageCap }
  }

  getBeforeAfter = () => {
    const before_yieldFarmingAPR = this.comp.props.yieldFarmingAPR
    const before_tradingFeeAPR = this.comp.props.tradingFeeAPR
    const before_klevaRewardsAPR = 0
    const before_borrowingInterestAPR = 0

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

  selectWorker = (borrowingAsset) => {
    const selectedWorker = this.workerList.find((w) => {
      return w.baseToken.address.toLowerCase() === borrowingAsset.address.toLowerCase()
    })

    this.worker$.next(selectedWorker)
    this.borrowingAsset$.next(borrowingAsset)

    this.baseToken$.next(borrowingAsset)

    const baseTokenNum = this.tokens.findIndex((t) => isSameAddress(t.address, borrowingAsset.address)) + 1
    this.baseTokenNum$.next(baseTokenNum)

    this.otherTokens$.next(this.tokens.filter((t) => {
      return !isSameAddress(t.address, borrowingAsset.address)
    }))
  }

  getBaseTokenAmount = () => {
    return this[`token${this.baseTokenNum$.value}Amount$`].value || 0
  }

  getAmountToBorrow = () => {
    const positionValue = this.estimatedPositionValueWithoutLeverage$.value

    let leverage = this.leverage$.value

    // @HACK This code resolves Klayswap error: Klayswap contract reverts transaction when there is 0 amount to swap.
    if (Number(leverage) >= 1.999 && Number(leverage) <= 2.001) {
      leverage = 1.999
    }

    return new BigNumber(positionValue)
      .multipliedBy(leverage - 1)
      .toFixed(0)
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

  getTokenAmountsPure = () => {
    const token1Amount = new BigNumber(this.token1Amount$.value || 0)
      .multipliedBy(10 ** this.token1?.decimals)
      .toString()

    const token2Amount = new BigNumber(this.token2Amount$.value || 0)
      .multipliedBy(10 ** this.token2?.decimals)
      .toString()

    const token3Amount = new BigNumber(this.token3Amount$.value || 0)
      .multipliedBy(10 ** this.token3?.decimals)
      .toString()

    const token4Amount = new BigNumber(this.token4Amount$.value || 0)
      .multipliedBy(10 ** this.token4?.decimals)
      .toString()

    const _tokenAmounts = [
      token1Amount,
      token2Amount,
      token3Amount,
      token4Amount,
    ]

    const tokenAmounts = this.tokens.map((t, idx) => _tokenAmounts[idx] || 0)

    const borrowIncludedTokenAmounts = this.tokens
      .map((t, idx) => {
        const num = idx + 1
        if (num == this.baseTokenNum$.value) {
          return new BigNumber(tokenAmounts[idx] || 0).plus(this.getAmountToBorrow()).toString()
        }

        return tokenAmounts[idx] || 0
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
      tokenAmounts,
      borrowIncludedTokenAmounts,
    }
  }

  getOpenPositionResult$ = () => {
    const { token1Amount, token2Amount, token3Amount, token4Amount, tokenAmounts, baseTokenAmount } = this.getTokenAmountsPure()

    console.log(tokenAmounts, 'tokenAmounts')

    return getPositionValue_kokonut$({
      workerAddress: this.worker$.value.workerAddress,
      tokenAmounts,
    }).pipe(
      switchMap((positionValue) => {

        this.estimatedPositionValueWithoutLeverage$.next(positionValue)

        const { borrowIncludedTokenAmounts } = this.getTokenAmountsPure()

        return forkJoin([
          getOpenPositionResult_kokonut$({
            workerAddress: this.worker$.value.workerAddress,
            tokenAmounts: borrowIncludedTokenAmounts,
            positionId: 0
          }),
        ])
      }),
      tap(([openPositionResult_leverage]) => {

        console.log(openPositionResult_leverage, 'openPositionResult_leverage')

        this.resultTokensAmount$.next(openPositionResult_leverage.receiveTokensAmt)
        this.resultLpAmount$.next(openPositionResult_leverage.receiveLpAmt)

        // console.log(openPositionResult_leverage.receiveLpAmt, 'openPositionResult_leverage.receiveLpAmt')
        // console.log(openPositionResult_leverage.lpAmtOnBalanced, 'openPositionResult_leverage.lpAmtOnBalanced')

        openPositionResult_leverage.lpAmtOnBalanced = new BigNumber(openPositionResult_leverage.lpAmtOnBalanced)
          .multipliedBy(2)
          .toString()

        const lpChangeRatio = new BigNumber(openPositionResult_leverage.receiveLpAmt)
          .gt(openPositionResult_leverage.lpAmtOnBalanced) 
            ? new BigNumber(openPositionResult_leverage.receiveLpAmt)
                .div(openPositionResult_leverage.lpAmtOnBalanced)
                .minus(1)
                .toNumber()
            : new BigNumber(1)
              .minus(
                new BigNumber(openPositionResult_leverage.receiveLpAmt)
                  .div(openPositionResult_leverage.lpAmtOnBalanced)
              )
              .toNumber()

        console.log(lpChangeRatio, 'lpChangeRatio')

        this.lpChangeRatio$.next(isNaN(lpChangeRatio) 
          ? 0
          : lpChangeRatio
        )

        // @NEW
        // openPositionResult.receiveTokensAmt
        // openPositionResult.receiveLpAmt
        // openPositionResult.lpAmtOnBalanced

        // openPositionResult_leverage.receiveTokensAmt
        // openPositionResult_leverage.receiveLpAmt
        // openPositionResult_leverage.lpAmtOnBalanced

        // @OLD
        // this.resultBaseTokenAmount$.next(openPositionResult_leverage.resultBaseTokenAmount)
        // this.resultFarmTokenAmount$.next(openPositionResult_leverage.resultFarmTokenAmount)

        // this.priceImpact$.next(new BigNumber(openPositionResult.priceImpactBps).div(10000).toString())

        // if (this.leverage$.value == 1) {
        //   this.leverageImpact$.next(0)
        // } else {
        //   this.leverageImpact$.next(new BigNumber(openPositionResult_leverage.priceImpactBps).div(10000).toString())
        // }
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

  setLeverageValue = (v, leverageCapRaw) => {
    if (v < 1) return
    if (v > leverageCapRaw) return
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

  addPosition = () => {
    const { tokenAmounts, baseTokenAmount } = this.getTokenAmountsPure()
    const otherTokensAmountSum = this.getOtherTokensAmountSum()

    console.log(otherTokensAmountSum, 'otherTokensAmountSum')

    const { strategyType, strategyAddress } = getStrategy({
      exchange: "kokonutswap",
      strategyType: (otherTokensAmountSum == 0 && baseTokenAmount != 0)
        ? "KOKONUTSWAP:ADD_BASE_TOKEN_ONLY"
        : "KOKONUTSWAP:ADD_ALL"
    })

    console.log(strategyType, 'strategyType')
    console.log(strategyAddress, 'strategyAddress')

    const borrowAmount = this.getAmountToBorrow()

    console.log(borrowAmount, 'borrowAmount')

    const MIN_LP_AMOUNT = new BigNumber(this.resultLpAmount$.value)
      .multipliedBy(1 - (Number(slippage$.value) / 100))
      .toFixed(0)
    console.log(MIN_LP_AMOUNT, '@MIN_LP_AMOUNT')


    console.log(tokenAmounts, 'tokenAmounts')

    const ext = strategyType === "KOKONUTSWAP:ADD_BASE_TOKEN_ONLY"
      ? caver.klay.abi.encodeParameters(['uint256'], [MIN_LP_AMOUNT])
      : caver.klay.abi.encodeParameters(
        ['uint256[]', 'uint256'],
        [
          this.tokens.map((_, idx) => tokenAmounts[idx]),
          MIN_LP_AMOUNT
        ])

    const data = caver.klay.abi.encodeParameters(['address', 'bytes'], [strategyAddress, ext])

    const principalAmount = baseTokenAmount

    console.log(baseTokenAmount, 'baseTokenAmount')
    console.log(this.baseToken$.value, 'this.baseToken$.value')

    addPosition$(this.worker$.value.vaultAddress, {
      workerAddress: this.worker$.value.workerAddress,
      principalAmount,
      borrowAmount,
      maxReturn: 0,
      data,
      // value: _value,
    }).pipe(
      tap(() => this.isLoading$.next(true)),
      switchMap((result) => getTransactionReceipt$(result && result.result || result.tx_hash))
    ).subscribe((result) => {
      this.isLoading$.next(false)
      fetchWalletInfo$.next(true)
      fetchPositions$.next(true)

      closeContentView$.next(true)

      openModal$.next({
        component: (
          <CompletedModal menus={[
            {
              title: I18n.t('viewInMyAsset'),
              onClick: () => {
                closeModal$.next(true)
                currentTab$.next('myasset&assetMenu=farming')
              }
            },
            {
              title: I18n.t('checkLater'),
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
