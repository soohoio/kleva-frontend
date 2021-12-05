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

    this.state = {
      leverageValue: 1,
      borrowingAsset: this.borrowingAvailableAssets[0],
    }
  }

  componentDidMount() {
    
  }
  
  componentWillUnMount() {
    this.destroy$.next(true)
  }

  setBorrowingAsset = (asset) => {
    this.setState({ borrowingAsset: asset })
  }
    
  render() {
    const { leverageValue, borrowingAsset } = this.state
    const {
      workerList,

      token1,
      token2,

      leverageCap,
      tvl,
      exchange,
      klevaRewards = 0,

      aprInfo,
      lpToken,

      token1BorrowingInterest,
      token2BorrowingInterest,
    } = this.props
    
    const yieldFarmingAPR = aprInfo && 
      new BigNumber(aprInfo.kspMiningAPR || 0)
      .plus(aprInfo.airdropAPR || 0)
      .toNumber()
    const tradingFeeAPR = aprInfo && new BigNumber(aprInfo.tradingFeeAPR || 0).toNumber()

    const borrowingInterest = borrowingAsset.title === token1.title 
      ? token1BorrowingInterest
      : token2BorrowingInterest

    const totalAPR = new BigNumber(yieldFarmingAPR)
      .plus(tradingFeeAPR)
      .plus(klevaRewards)
      .minus(borrowingInterest)
      .toNumber()

    const APY = toAPY(totalAPR)

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
          <FarmProperty label="Borrowing Interest" value={`${borrowingInterest}%`} />
          <FarmProperty className="FarmItem__totalAPR" label="Total APR" value={`${Number(totalAPR).toLocaleString('en-us', { maximumFractionDigits: 2 })}%`} />
        </div>
        <div className="FarmItem__footer">
          <LeverageController
            currentLeverage={leverageValue}
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