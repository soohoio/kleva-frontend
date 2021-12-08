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
    
  render() {
    const { leverageValue, borrowingAsset, worker } = this.state
    const {
      workerList,

      token1,
      token2,

      tvl,
      exchange,
      klevaRewards = 0,

      aprInfo,
      lpToken,

      token1BorrowingInterest,
      token2BorrowingInterest,

      workerInfo,
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
        return {
          ...item,
          title: `${item.title} -${borrowingInterestsAPR[item.address.toLowerCase()]}%`,
          borrowingInterestAPR: borrowingInterestsAPR[item.address.toLowerCase()]
        }
      })

    const selectedBorrowingAssetWithInterest = borrowingInterestAttachedAssets.find((a) => a.address.toLowerCase() === borrowingAsset.address.toLowerCase())

    const totalAPR = new BigNumber(yieldFarmingAPR)
      .plus(tradingFeeAPR)
      .plus(klevaRewards)
      .minus(selectedBorrowingInterestAPR)
      .toNumber()

    const APY = toAPY(totalAPR)

    const workerConfig = workerInfo &&
      workerInfo[worker.workerAddress.toLowerCase()] || workerInfo[worker.workerAddress]

    const leverageCap = workerConfig && (workerConfig.workFactorBps / (10000 - workerConfig.workFactorBps))

    return (
      <div className="FarmItem">
        <div className="FarmItem__header">
          <div className="FarmItem__tokenImages">
            <img className="FarmItem__tokenIcon" src={token1.iconSrc} />
            <img className="FarmItem__tokenIcon FarmItem__tokenIcon--baseToken" src={token2.iconSrc} />
          </div>
          <div className="FarmItem__mainInfo">
            <p className="FarmItem__title">{token1.title}-{token2.title}</p>
            <p className="FarmItem__tvl">TVL ${tvl}</p>
          </div>
          <div className="FarmItem__subInfo">
            <p className="FarmItem__apy">{Number(APY).toLocaleString('en-us', {maximumFractionDigits: 2 })}%</p>
            <p className="FarmItem__exchange">{exchange}</p>
          </div>
        </div>
        <div className="FarmItem__content">
          <FarmProperty label="Yield Farming" value={`${yieldFarmingAPR}%`} />
          <FarmProperty label="Trading Fees" value={`${tradingFeeAPR}%`} />
          <FarmProperty label="KLEVA Rewards" value={`${klevaRewards}%`} />
          <FarmProperty 
            label="Borrowing Interest" 
            value={(
              <BorrowingAssetSelector
                list={borrowingInterestAttachedAssets}
                selected={selectedBorrowingAssetWithInterest}
                borrowingInterestsAPR={borrowingInterestsAPR}
              />
            )} 
          />
          <FarmProperty className="FarmItem__totalAPR" label="Total APR" value={`${Number(totalAPR).toLocaleString('en-us', { maximumFractionDigits: 2 })}%`} />
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
            className="FarmItem__button"
            onClick={() => {
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
            Farm {leverageValue}X
          </button>
        </div>
      </div>
    )
  }
}

export default FarmItem