import { BehaviorSubject, Subject, forkJoin } from 'rxjs'
import { takeUntil, tap, switchMap, map } from 'rxjs/operators'

import { calcKlevaRewardsAPR, getBufferedLeverage, toAPY } from '../../utils/calc'
import { lendingPoolsByStakingTokenAddress } from '../../constants/lendingpool'
import { debtTokens, lpTokenByIngredients, tokenList } from '../../constants/tokens'
import { nFormatter, noRounding } from '../../utils/misc'

export default class {
  constructor(comp) {
    this.comp = comp

    const { token1, token2 } = this.comp.props

    const defaultBorrowingAsset = this.getBorrowingAvailableAsset()[0]

    const selectedWorker = this.comp.props.workerList.find((w) => {
      return w.baseToken.address.toLowerCase() === defaultBorrowingAsset.address.toLowerCase()
    })

    // this.borrowingAsset$ = new BehaviorSubject(defaultBorrowingAsset)
    this.worker$ = new BehaviorSubject(selectedWorker)

    this.leverageValue$ = new BehaviorSubject(2) // default leverage: 2

    // this.leverageMemoryMap$ = new BehaviorSubject({
    //   [token1.address.toLowerCase()]: 2,
    //   [token2.address.toLowerCase()]: 2
    // })

    this.comp.props.sortTypeChanged$.pipe(
      takeUntil(this.comp.destroy$)
    ).subscribe(() => {
      this.leverageValue$.next(2)
    })
  }

  getBorrowingAvailableAsset = () => {
    return [
      this.comp.props.token1, 
      this.comp.props.token2,
      this.comp.props.token3,
      this.comp.props.token4,
    ]
    .filter((t) => {

      if (!t) return false
      if (t && t.borrowingDisabled) return false

      const address = t.address
      const hasLendingPool = !!lendingPoolsByStakingTokenAddress[address.toLowerCase()]
      return hasLendingPool
    })
  }

  getBorrowingInterests = (leverageValue) => {

    const {
      token1,
      token2,
      token3,
      token4,
      token1BorrowingInterest,
      token2BorrowingInterest,
      token3BorrowingInterest,
      token4BorrowingInterest,
    } = this.comp.props

    const borrowingAsset = this.comp.props.borrowingAssetMap$.value[this.comp.props.lpToken.address]

    const baseBorrowingInterests = {
      [token1.address.toLowerCase()]: {
        token: token1,
        baseInterest: (token1BorrowingInterest || 0),
      },
      [token2.address.toLowerCase()]: {
        token: token2,
        baseInterest: (token2BorrowingInterest || 0),
      },
      [token3 && token3.address.toLowerCase()]: {
        token: token3,
        baseInterest: (token3BorrowingInterest || 0),
      },
      [token4 && token4.address.toLowerCase()]: {
        token: token4,
        baseInterest: (token4BorrowingInterest || 0),
      },
    }

    const borrowingInterests = this.getBorrowingAvailableAsset()
      .map((item) => {

        const interest = baseBorrowingInterests[item.address.toLowerCase()]?.baseInterest * (leverageValue - 1)

        return {
          ...item,
          interest,
        }
      })
      
    const selectedBorrowingAssetWithInterest = borrowingInterests
      .find((a) => a.address.toLowerCase() === borrowingAsset.address.toLowerCase())

    const selectedBorrowingInterestAPR = selectedBorrowingAssetWithInterest?.interest

    return {
      baseBorrowingInterests, // without leverage
      borrowingInterests, // with leverage
      selectedBorrowingInterestAPR,
      selectedBorrowingAssetWithInterest,
    }
  }

  setBorrowingAsset = ({ asset }) => {
    const { workerList, workerInfo } = this.comp.props

    const selectedWorker = workerList.find((w) => {
      return w.baseToken.address.toLowerCase() === asset.address.toLowerCase()
    })

    // this.borrowingAsset$.next(asset)
    this.comp.props.borrowingAssetMap$.next({
      ...this.comp.props.borrowingAssetMap$.value,
      [this.comp.props.lpToken.address]: asset,
    })
    console.log(selectedWorker, 'selectedWorker')
    this.worker$.next(selectedWorker)

    const leverageCap = this.getLeverageCap()
    
    if (this.leverageValue$.value > leverageCap) {
      this.leverageValue$.next(leverageCap)
    }
    // Restore memoized leverage value 
    // this.leverageValue$.next(
    //   this.leverageMemoryMap$.value[asset.address.toLowerCase()]
    // )
  }

  getLeverageCap = () => {
    const { workerInfo } = this.comp.props

    const worker = this.worker$.value
    const workerConfig = workerInfo &&
      worker &&
      workerInfo[worker.workerAddress.toLowerCase()] || workerInfo[worker.workerAddress]
    
    const leverageCap = Number(noRounding(workerConfig && 10000 / (10000 - workerConfig.workFactorBps), 1))

    return leverageCap
  }

  setLeverageValue = (v, leverageCapRaw) => {
    if (v < 1) return
    if (v > leverageCapRaw) return

    // const borrowingAsset = this.comp.props.borrowingAssetMap$.value[this.comp.props.lpToken.address]

    // memoize leverage value

    // this.leverageMemoryMap$.next({
    //   ...this.leverageMemoryMap$.value,
    //   [borrowingAsset.address.toLowerCase()]: v,
    // })

    this.leverageValue$.next(v)
  }

  getDebtTokenKlevaRewardsAPR = (leverageValue) => {
    const { klevaAnnualRewards, tokenPrices, lendingTokenSupplyInfo } = this.comp.props

    // const borrowingAsset = this.borrowingAsset$.value
    const borrowingAsset = this.comp.props.borrowingAssetMap$.value[this.comp.props.lpToken.address]

    return calcKlevaRewardsAPR({
      tokenPrices,
      lendingTokenSupplyInfo,
      borrowingAsset,
      debtTokens,
      klevaAnnualRewards: klevaAnnualRewards,
      klevaTokenPrice: tokenPrices[tokenList.KLEVA.address.toLowerCase()],
      leverage: leverageValue,
    })
  }

  getYieldFarmingAPR = (leverageValue) => {
    const { aprInfo } = this.comp.props

    const yieldFarmingAPR = aprInfo &&
      new BigNumber(aprInfo.miningAPR || 0)
        .plus(aprInfo.airdropAPR || 0)
        .multipliedBy(leverageValue)
        .toNumber()

    return yieldFarmingAPR
  }

  getWorkerConfig = () => {
    const { aprInfo, workerInfo } = this.comp.props
    const worker = this.worker$.value
    
    const workerConfig = workerInfo &&
      worker &&
      (workerInfo[worker.workerAddress.toLowerCase()] || workerInfo[worker.workerAddress])

    return workerConfig
  }

  getRenderIngredients = () => {
    const {
      aprInfo,
      workerInfo,
    } = this.comp.props

    const leverageValue = this.leverageValue$.value
    const worker = this.worker$.value

    const workerConfig = workerInfo &&
      worker &&
      (workerInfo[worker.workerAddress.toLowerCase()] || workerInfo[worker.workerAddress])

    const leverageCapRaw = workerConfig.isMembershipUser
      ? workerConfig && 10000 / (10000 - workerConfig.membershipWorkFactorBps)
      : workerConfig && 10000 / (10000 - workerConfig.workFactorBps)

    const leverageCap = workerConfig.isMembershipUser
      ? workerConfig && getBufferedLeverage(workerConfig.membershipWorkFactorBps)
      : workerConfig && getBufferedLeverage(workerConfig.workFactorBps)

    const boostedMaximumLeverageCap = workerConfig && getBufferedLeverage(workerConfig.membershipWorkFactorBps)

    const { selectedBorrowingInterestAPR: selectedBorrowingInterestAPRWithoutLeverage } = this.getBorrowingInterests(this.leverageValue$.value)
    const { selectedBorrowingInterestAPR } = this.getBorrowingInterests(this.leverageValue$.value)
    const { selectedBorrowingInterestAPR: boostedMaximumBorrowingInterestAPR } = this.getBorrowingInterests(boostedMaximumLeverageCap)

    const yieldFarmingAPRWithoutLeverage = this.getYieldFarmingAPR(1)
    const yieldFarmingAPR = this.getYieldFarmingAPR(leverageValue)
    const boostedMaximumYieldFarmingAPR = this.getYieldFarmingAPR(boostedMaximumLeverageCap)

    const tradingFeeAPRWithoutLeverage = aprInfo && new BigNumber(aprInfo.tradingFeeAPR || 0)
      .toNumber()
    
    const tradingFeeAPR = aprInfo && new BigNumber(tradingFeeAPRWithoutLeverage)
      .multipliedBy(leverageValue)
      .toNumber()

    const boostedMaximumTradingFeeAPR = aprInfo && new BigNumber(tradingFeeAPRWithoutLeverage)
      .multipliedBy(boostedMaximumLeverageCap)
      .toNumber()

    const debtTokenKlevaRewardsAPR = this.getDebtTokenKlevaRewardsAPR(this.leverageValue$.value)
    const boostedMaximumDebtTokenKlevaRewardsAPR = this.getDebtTokenKlevaRewardsAPR(boostedMaximumLeverageCap)
    
    // boosted APR
    const boostedMaximumTotalAPR = new BigNumber(boostedMaximumYieldFarmingAPR)
      .plus(boostedMaximumTradingFeeAPR)
      .plus(boostedMaximumDebtTokenKlevaRewardsAPR)
      .minus(boostedMaximumBorrowingInterestAPR)
      .toNumber()

    const totalAPR = new BigNumber(yieldFarmingAPR)
      .plus(tradingFeeAPR)
      .plus(debtTokenKlevaRewardsAPR)
      .minus(selectedBorrowingInterestAPR)
      .toNumber()

    const APY = toAPY(totalAPR)

    const boostedMaximumAPY = toAPY(boostedMaximumTotalAPR)

    return {
      yieldFarmingAPRWithoutLeverage,
      yieldFarmingAPR,
      tradingFeeAPR,
      tradingFeeAPRWithoutLeverage,
      debtTokenKlevaRewardsAPR,
      totalAPR,
      APY,
      leverageCapRaw,
      leverageCap,

      // boosted
      boostedMaximumYieldFarmingAPR,
      boostedMaximumTradingFeeAPR,
      boostedMaximumDebtTokenKlevaRewardsAPR,
      boostedMaximumBorrowingInterestAPR,
      boostedMaximumTotalAPR,
      boostedMaximumAPY,
    }
  }
} 
