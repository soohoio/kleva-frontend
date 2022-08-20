import { BehaviorSubject, Subject, forkJoin } from 'rxjs'
import { takeUntil, tap, switchMap, map } from 'rxjs/operators'

import { calcKlevaRewardsAPR, getBufferedLeverage, toAPY } from '../../utils/calc'
import { lendingPoolsByStakingTokenAddress } from '../../constants/lendingpool'
import { debtTokens, lpTokenByIngredients, tokenList } from '../../constants/tokens'
import { nFormatter } from '../../utils/misc'

export default class {
  constructor(comp) {
    this.comp = comp

    const defaultBorrowingAsset = this.getBorrowingAvailableAsset()[0]

    const selectedWorker = this.comp.props.workerList.find((w) => {
      return w.baseToken.address.toLowerCase() === defaultBorrowingAsset.address.toLowerCase()
    })

    // this.borrowingAsset$ = new BehaviorSubject(defaultBorrowingAsset)
    this.worker$ = new BehaviorSubject(selectedWorker)
    this.leverageValue$ = new BehaviorSubject(1)
  }

  getBorrowingAvailableAsset = () => {
    return [this.comp.props.token1, this.comp.props.token2].filter(({ address }) => {
      const hasLendingPool = !!lendingPoolsByStakingTokenAddress[address.toLowerCase()]
      return hasLendingPool
    })
  }

  getBorrowingInterests = () => {

    const {
      token1,
      token2,
      token1BorrowingInterest,
      token2BorrowingInterest,
    } = this.comp.props

    const leverageValue = this.leverageValue$.value

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
    const { workerList } = this.comp.props
    const selectedWorker = workerList.find((w) => {
      return w.baseToken.address.toLowerCase() === asset.address.toLowerCase()
    })

    // this.borrowingAsset$.next(asset)
    this.comp.props.borrowingAssetMap$.next({
      ...this.comp.props.borrowingAssetMap$.value,
      [this.comp.props.lpToken.address]: asset,
    })
    this.worker$.next(selectedWorker)

    // Reset Leverage
    this.leverageValue$.next(1)
  }

  setLeverageValue = (v, leverageCapRaw) => {
    if (v < 1) return
    if (v > leverageCapRaw) return
    this.leverageValue$.next(v)
  }

  getDebtTokenKlevaRewardsAPR = () => {
    const { klevaAnnualRewards, tokenPrices, lendingTokenSupplyInfo } = this.comp.props

    // const borrowingAsset = this.borrowingAsset$.value
    const borrowingAsset = this.comp.props.borrowingAssetMap$.value[this.comp.props.lpToken.address]
    const leverageValue = this.leverageValue$.value

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
      new BigNumber(aprInfo.kspMiningAPR || 0)
        .plus(aprInfo.airdropAPR || 0)
        .multipliedBy(leverageValue)
        .toNumber()

    return yieldFarmingAPR
  }

  getRenderIngredients = () => {
    const {
      aprInfo,
      workerInfo,
    } = this.comp.props

    const leverageValue = this.leverageValue$.value
    const worker = this.worker$.value

    const { selectedBorrowingInterestAPR } = this.getBorrowingInterests()

    const yieldFarmingAPRWithoutLeverage = this.getYieldFarmingAPR(1)
    const yieldFarmingAPR = this.getYieldFarmingAPR(leverageValue)

    const tradingFeeAPR = aprInfo && new BigNumber(aprInfo.tradingFeeAPR || 0)
      .multipliedBy(leverageValue)
      .toNumber()

    const debtTokenKlevaRewardsAPR = this.getDebtTokenKlevaRewardsAPR()

    const totalAPR = new BigNumber(yieldFarmingAPR)
      .plus(tradingFeeAPR)
      .plus(debtTokenKlevaRewardsAPR)
      .minus(selectedBorrowingInterestAPR)
      .toNumber()

    const APY = toAPY(totalAPR)

    const workerConfig = workerInfo &&
      worker &&
      workerInfo[worker.workerAddress.toLowerCase()] || workerInfo[worker.workerAddress]

    const leverageCapRaw = workerConfig && 10000 / (10000 - workerConfig.workFactorBps)
    const leverageCap = workerConfig && getBufferedLeverage(workerConfig.workFactorBps)

    return {
      yieldFarmingAPRWithoutLeverage,
      yieldFarmingAPR,
      tradingFeeAPR,
      debtTokenKlevaRewardsAPR,
      totalAPR,
      APY,
      leverageCapRaw,
      leverageCap,
    }
  }
} 
