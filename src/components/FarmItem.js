import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import { openModal$ } from 'streams/ui'

import LeverageController from './LeverageController'
import AddPositionPopup from './AddPositionPopup'


import './FarmItem.scss'
import { toAPY } from '../utils/calc'
import { lendingPoolsByStakingTokenAddress } from '../constants/lendingpool'
import BorrowingAssetSelector from './BorrowingAssetSelector'
import { debtTokens, getIbTokenFromOriginalToken, tokenList } from '../constants/tokens'
import { nFormatter } from '../utils/misc'

const FarmProperty = ({ className, label, value }) => {
  return (
    <div className={cx("FarmProperty", className)}>
      <div className="FarmProperty__label">{label}</div>
      <div className="FarmProperty__value">{value}</div>
    </div>
  )
}

class FarmItem extends Component {
  destroy$ = new Subject()
  
  constructor(props) {
    super(props)

    this.borrowingAvailableAssets = [props.token1, props.token2].filter(({ address }) => {
      const hasLendingPool = !!lendingPoolsByStakingTokenAddress[address.toLowerCase()]
      return hasLendingPool
    })

    const defaultBorrowingAsset = this.borrowingAvailableAssets[0]

    const selectedWorker = props.workerList.find((w) => {
      return w.baseToken.address.toLowerCase() === defaultBorrowingAsset.address.toLowerCase()
    })

    this.state = {
      leverageValue: 1,
      borrowingAsset: defaultBorrowingAsset,
      worker: selectedWorker,
    }
  }

  componentDidMount() {
    
  }
  
  componentWillUnMount() {
    this.destroy$.next(true)
  }

  setBorrowingAsset = (asset) => {
    const { workerList } = this.props

    const selectedWorker = workerList.find((w) => {
      return w.baseToken.address.toLowerCase() === asset.address.toLowerCase()
    })
    this.setState({ 
      borrowingAsset: asset,
      worker: selectedWorker,
    })
  }

  getDebtTokenKlevaRewardsAPR = () => {
    const { borrowingAsset, leverageValue } = this.state
    const { klevaAnnualRewards, farmDeposited, tokenPrices, lendingTokenSupplyInfo } = this.props

    const ibToken = getIbTokenFromOriginalToken(borrowingAsset)
    const debtToken = debtTokens[ibToken.address] || debtTokens[ibToken.address.toLowerCase()]
    const debtTokenPid = debtToken && debtToken.pid
    const klevaAnnualRewardForDebtToken = klevaAnnualRewards[debtTokenPid]

    // const farmTVL = new BigNumber(farmDeposited && farmDeposited.deposited)
    //   .multipliedBy(tokenPrices[farmDeposited && farmDeposited.lpToken && farmDeposited.lpToken.address.toLowerCase()])

    const _tokenInfo = lendingTokenSupplyInfo && lendingTokenSupplyInfo[borrowingAsset.address.toLowerCase()]
    const _debtTokenInfo = _tokenInfo && _tokenInfo.debtTokenInfo

    const klevaRewardsAPR = new BigNumber(klevaAnnualRewardForDebtToken)
      .multipliedBy(tokenPrices[tokenList.KLEVA.address])
      .div(_tokenInfo && _tokenInfo.debtTokenTotalSupply)
      .multipliedBy(10 ** (_debtTokenInfo && _debtTokenInfo.decimals))
      .multipliedBy(leverageValue - 1)
      .multipliedBy(100)
      .toNumber()

    return klevaRewardsAPR || 0
  }
    
  render() {
    const { leverageValue, borrowingAsset, worker } = this.state
    const {
      workerList,

      token1,
      token2,

      farmDeposited,
      exchange,

      aprInfo,
      lpToken,

      token1BorrowingInterest,
      token2BorrowingInterest,

      workerInfo,
      klevaAnnualRewards,
      tokenPrices,

      selectedAddress,
    } = this.props
    
    const yieldFarmingAPR = aprInfo && 
      new BigNumber(aprInfo.kspMiningAPR || 0)
      .plus(aprInfo.airdropAPR || 0)
      .multipliedBy(leverageValue)
      .toNumber()
      
    const tradingFeeAPR = aprInfo && new BigNumber(aprInfo.tradingFeeAPR || 0).toNumber()

    const borrowingInterestsAPR = {
      [token1.address.toLowerCase()]: (token1BorrowingInterest || 0) * (leverageValue - 1),
      [token2.address.toLowerCase()]: (token2BorrowingInterest || 0) * (leverageValue - 1),
    }

    const selectedBorrowingInterestAPR = borrowingInterestsAPR[borrowingAsset.address.toLowerCase()]

    const borrowingInterestAttachedAssets = this.borrowingAvailableAssets
      .map((item) => {

        const interest = borrowingInterestsAPR[item.address.toLowerCase()]

        return {
          ...item,
          rightContent: `-${Number(interest).toLocaleString('en-us', {maximumFractionDigits: 2 })}%`,
        }
      })

    const selectedBorrowingAssetWithInterest = borrowingInterestAttachedAssets
      .find((a) => a.address.toLowerCase() === borrowingAsset.address.toLowerCase())

    const debtTokenKlevaRewardsAPR = this.getDebtTokenKlevaRewardsAPR()

    const totalAPR = new BigNumber(yieldFarmingAPR)
      .plus(tradingFeeAPR)
      .plus(debtTokenKlevaRewardsAPR)
      .minus(selectedBorrowingInterestAPR)
      .toNumber()

    const APY = toAPY(totalAPR)

    const workerConfig = workerInfo &&
      workerInfo[worker.workerAddress.toLowerCase()] || workerInfo[worker.workerAddress]

    const leverageCap = workerConfig && (10000 / (10000 - workerConfig.workFactorBps))

    return (
      <div className="FarmItem">
        <div className="FarmItem__header">
          <div className="FarmItem__tokenImages">
            <img className="FarmItem__tokenIcon" src={token1.iconSrc} />
            <img className="FarmItem__tokenIcon FarmItem__tokenIcon--baseToken" src={token2.iconSrc} />
          </div>
          <div className="FarmItem__mainInfo">
            <p className="FarmItem__title">{token1.title}-{token2.title}</p>
            <p className="FarmItem__tvl">TVL ${farmDeposited && nFormatter(farmDeposited.deposited, 2)}</p>
          </div>
          <div className="FarmItem__subInfo">
            <p className="FarmItem__apy">{Number(APY).toLocaleString('en-us', {maximumFractionDigits: 2 })}%</p>
            <p className="FarmItem__exchange">{exchange}</p>
          </div>
        </div>
        <div className="FarmItem__content">
          <FarmProperty label="Yield Farming" value={`${nFormatter(yieldFarmingAPR, 2)}%`} />
          <FarmProperty label="Trading Fees" value={`${nFormatter(tradingFeeAPR, 2)}%`} />
          <FarmProperty label="KLEVA Rewards" value={`${nFormatter(debtTokenKlevaRewardsAPR, 2)}%`} />
          <FarmProperty 
            label="Borrowing Interest" 
            value={(
              <BorrowingAssetSelector
                list={borrowingInterestAttachedAssets}
                selected={selectedBorrowingAssetWithInterest}
                onSelect={(item) => {
                  this.setState({ borrowingAsset: item })
                }}
              />
            )} 
          />
          <FarmProperty className="FarmItem__totalAPR" label="Total APR" value={`${nFormatter(totalAPR, 2)}%`} />
        </div>
        <div className="FarmItem__footer">
          <LeverageController
            offset={0.5}
            currentLeverage={leverageValue}
            leverageCap={leverageCap}
            setLeverage={(v) => {
              if (v < 1) return
              if (v > leverageCap) return
              this.setState({ leverageValue: v })
            }} 
          />
          <button 
            className={cx("FarmItem__button", {
              "FarmItem__button--disabled": !selectedAddress,
            })}
            onClick={() => {

              if (!selectedAddress) return

              openModal$.next({
                component: (
                <AddPositionPopup 
                  title="Add Position" 
                  yieldFarmingAPR={yieldFarmingAPR}
                  tradingFeeAPR={tradingFeeAPR}
                  
                  workerList={workerList}
                  workerInfo={workerInfo}

                  token1={token1}
                  token2={token2}

                  lpToken={lpToken}
                  borrowingAvailableAssets={this.borrowingAvailableAssets}
                  leverage={1}
                />)
              })
            }}
          >
            Farm {leverageValue}x
          </button>
        </div>
      </div>
    )
  }
}

export default FarmItem