import React from 'react'
import { Subject, BehaviorSubject, forkJoin } from 'rxjs'
import { switchMap, tap } from 'rxjs/operators'
import BigNumber from 'bignumber.js'

import { STRATEGIES } from 'constants/address'
import { addPosition$, approve$, caver, getOpenPositionResult$, getOutputTokenAmount$, getPositionValue$, getTransactionReceipt$ } from '../../streams/contract'
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

export default class {
  constructor(comp) {
    this.comp = comp

    this.token1 = comp.props.token1
    this.token2 = comp.props.token2

    this.lpToken = comp.props.lpToken
    this.workerList = comp.props.workerList

    this.isLoading$ = new BehaviorSubject()

    this.borrowingAsset$ = new BehaviorSubject(comp.props.defaultBorrowingAsset || comp.props.borrowingAvailableAssets[0])

    // this.worker$
    this.farmingToken$ = new BehaviorSubject(
      [this.token1, this.token2]
        .find((t) => t.address.toLowerCase() !== this.borrowingAsset$.value.address.toLowerCase())
    )
    this.baseToken$ = new BehaviorSubject(this.borrowingAsset$.value)

    this.worker$ = new BehaviorSubject()
    this.selectWorker(this.borrowingAsset$.value)

    this.farmingTokenAmount$ = new BehaviorSubject('')
    this.baseTokenAmount$ = new BehaviorSubject('')
    this.priceImpact$ = new BehaviorSubject('')
    this.leverageImpact$ = new BehaviorSubject('')
    this.allowances$ = new BehaviorSubject({})
    this.leverage$ = new BehaviorSubject(1)
    this.borrowMoreAvailable$ = new BehaviorSubject(true)
    this.isDebtSizeValid$ = new BehaviorSubject(true)

    this.resultBaseTokenAmount$ = new BehaviorSubject()
    this.resultFarmTokenAmount$ = new BehaviorSubject()
    this.estimatedPositionValueWithoutLeverage$ = new BehaviorSubject(0)

    this.fetchAllowances$ = new Subject()

    this.fiftyfiftyMode$ = new BehaviorSubject(false)
    this.isFarmingFocused$ = new BehaviorSubject(false)
    this.isBaseFocused$ = new BehaviorSubject(false)

    this.init()
  }

  init = () => {
    // const { defaultWorker } = this.comp.props

    this.leverage$.next(this.comp.props.defaultLeverage)
    // if (defaultWorker) {
    //   this.worker$.next(defaultWorker)
    // }
  }

  getTokens = () => {
    const { token1, token2 } = this.comp.props

    const ibToken = getIbTokenFromOriginalToken(this.borrowingAsset$.value)

    const farmingToken = isSameAddress(this.borrowingAsset$.value?.address, token1?.address)
      ? token2
      : token1

    const baseToken = isSameAddress(this.borrowingAsset$.value?.address, token1?.address)
      ? token1
      : token2

    return { ibToken, farmingToken, baseToken }
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
    this.farmingToken$.next([this.token1, this.token2].find((t) => t.address.toLowerCase() !== borrowingAsset.address.toLowerCase()))
  }

  getAmountToBorrow = () => {
    const positionValue = this.estimatedPositionValueWithoutLeverage$.value

    const leverage = this.leverage$.value

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

  getOpenPositionResult$ = () => {

    const baseTokenAmount = new BigNumber(this.baseTokenAmount$.value || 0)
      .multipliedBy(10 ** this.baseToken$.value.decimals)
      .toString()

    const farmTokenAmount = new BigNumber(this.farmingTokenAmount$.value || 0)
      .multipliedBy(10 ** this.farmingToken$.value.decimals)
      .toString()

    return getPositionValue$({
      workerAddress: this.worker$.value.workerAddress,
      baseTokenAmount: baseTokenAmount,
      farmingTokenAmount: farmTokenAmount,
    }).pipe(
      switchMap((positionValue) => {

        this.estimatedPositionValueWithoutLeverage$.next(positionValue)

        const leveragedBaseTokenAmount = new BigNumber(baseTokenAmount)
          .plus(this.getAmountToBorrow() || 0)
          .toString()

        return forkJoin([
          getOpenPositionResult$({
            workerAddress: this.worker$.value.workerAddress,
            leveragedBaseTokenAmount: baseTokenAmount,
            farmTokenAmount,
            positionId: 0
          }),
          getOpenPositionResult$({
            workerAddress: this.worker$.value.workerAddress,
            leveragedBaseTokenAmount: leveragedBaseTokenAmount,
            farmTokenAmount,
            positionId: 0
          }),
        ])
      }),
      tap(([openPositionResult, openPositionResult_leverage]) => {
        this.resultBaseTokenAmount$.next(openPositionResult_leverage.resultBaseTokenAmount)
        this.resultFarmTokenAmount$.next(openPositionResult_leverage.resultFarmTokenAmount)

        this.priceImpact$.next(new BigNumber(openPositionResult.priceImpactBps).div(10000).toString())

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

    const borrowAmount = this.getAmountToBorrow()
    
    const borrowingInUSD = new BigNumber(borrowAmount || 0)
      .div(10 ** this.baseToken$.value?.decimals)
      .multipliedBy(baseTokenPrice)
      .toString()

    const totalInUSD = new BigNumber(farmingInUSD).plus(baseInUSD).plus(borrowingInUSD)

    return {
      farmingValue: new BigNumber(farmingInUSD).div(totalInUSD || 1).multipliedBy(100).toNumber(),
      baseValue: new BigNumber(baseInUSD)
        .plus(borrowingInUSD) // borrowing
        .div(totalInUSD || 1)
        .multipliedBy(100).toNumber(),
    }
  }

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

  getStrategy = () => {
    // FarmingTokenAmount Doesn't exist -> AddBaseTokenOnly
    if (this.farmingTokenAmount$.value == 0) {
      return { strategyType: "ADD_BASE_TOKEN_ONLY", strategyAddress: STRATEGIES["ADD_BASE_TOKEN_ONLY"] }
    }

    // FarmingTokenAmount Exists -> AddTwoSidesOptimal
    return { strategyType: "ADD_TWO_SIDES_OPTIMAL", strategyAddress: STRATEGIES["ADD_TWO_SIDES_OPTIMAL"] }
  }

  addPosition = () => {
    const { strategyType, strategyAddress } = this.getStrategy()

    const baseTokenAmount = new BigNumber(this.baseTokenAmount$.value || 0)

    const borrowAmount = this.getAmountToBorrow()

    const poolInfo = addressKeyFind(klayswapPoolInfo$.value, this.lpToken?.address)
    const expectedLpAmount = getLPAmountBasedOnIngredientsToken({
      poolInfo,
      token1: {
        ...this.baseToken$.value,
        amount: new BigNumber(this.baseTokenAmount$.value || 0)
          .multipliedBy(10 ** this.baseToken$.value?.decimals)
          .toString()
      },
      token2: {
        ...this.farmingToken$.value,
        amount: new BigNumber(this.farmingTokenAmount$.value || 0)
          .multipliedBy(10 ** this.farmingToken$.value?.decimals)
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
        [new BigNumber(this.farmingTokenAmount$.value)
          .multipliedBy(10 ** this.farmingToken$.value.decimals)
          .toString(),
          MIN_LP_AMOUNT
        ])

    const data = caver.klay.abi.encodeParameters(['address', 'bytes'], [strategyAddress, ext])

    const principalAmount = baseTokenAmount
      .multipliedBy(10 ** this.baseToken$.value.decimals)
      .toString()

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

  handleFiftyFiftyMode = ({ from }) => {
    const poolInfo = klayswapPoolInfo$.value[this.lpToken?.address?.toLowerCase()]

    if (from === 'farmingToken') {
      
      if (this.farmingTokenAmount$.value == 0) {
        this.baseTokenAmount$.next(0)
        return
      }

      const baseOptimalAmount = getOptimalAmount(
        new BigNumber(this.farmingTokenAmount$.value).multipliedBy(10 ** this.farmingToken$.value.decimals).toString(),
        isSameAddress(this.farmingToken$.value?.address, poolInfo.tokenA)
          ? poolInfo.amountA
          : poolInfo.amountB,
        isSameAddress(this.farmingToken$.value?.address, poolInfo.tokenA)
          ? poolInfo.amountB
          : poolInfo.amountA,
      )

      this.baseTokenAmount$.next(
        new BigNumber(baseOptimalAmount)
          .div(10 ** this.baseToken$.value?.decimals)
          .toFixed(6)
        )
      return
    }

    if (from === 'baseToken') {

      if (this.baseTokenAmount$.value == 0) {
        this.farmingTokenAmount$.next(0)
        return
      }

      const farmingOptimalAmount = getOptimalAmount(
        new BigNumber(this.baseTokenAmount$.value).multipliedBy(10 ** this.baseToken$.value.decimals).toString(),
        isSameAddress(this.baseToken$.value?.address, poolInfo.tokenA)
          ? poolInfo.amountA
          : poolInfo.amountB,
        isSameAddress(this.baseToken$.value?.address, poolInfo.tokenA)
          ? poolInfo.amountB
          : poolInfo.amountA,
      )
  
      this.farmingTokenAmount$.next(
        new BigNumber(farmingOptimalAmount)
          .div(10 ** this.farmingToken$.value?.decimals)
          .toFixed(6)
        )
    }
  }
} 
