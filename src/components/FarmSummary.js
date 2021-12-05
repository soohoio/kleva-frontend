import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import FarmSummaryItem from './FarmSummaryItem'

import './FarmSummary.scss'

const BeforeAfter = ({ before, after }) => {
  return (
    <div className={cx("BeforeAfter")}>
      <div className="BeforeAfter__before">{before}</div>
      <img className="BeforeAfter__arrow" src="/static/images/arrow-right.svg" />
      <div className="BeforeAfter__after">{after}</div>
    </div>
  )
}

class FarmSummary extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    
  }
  
  componentWillUnMount() {
    this.destroy$.next(true)
  }
    
  render() {
    const { 
      yieldFarmingBefore,
      yieldFarmingAfter,
      tradingFeeBefore,
      tradingFeeAfter,
      klevaRewardAPR,
      borrowingInterestAPR,

      farmingTokenSupplied,
      baseTokenSupplied,
      borrowingAsset,
      borrowingAmount,
      priceImpact,
      farmingTokenPositionValue,
      baseTokenPositionValue,

      farmingToken,
      baseToken,

      shareOfPool,

      totalAPRBefore,
      totalAPRAfter,
      totalAPYBefore,
      totalAPYAfter,
    } = this.props
    
    return (
      <div className="FarmSummary">
        <p className="FarmSummary__title">Summary</p>
        <div className="FarmSummary__content">
            <FarmSummaryItem 
              className="FarmSummaryItem__yieldFarming"
              left="Yield Farming"
              right={(
                <BeforeAfter 
                  before={`${yieldFarmingBefore}%`}
                  after={`${yieldFarmingAfter}%`}
                />
              )}
            />
            <FarmSummaryItem 
              className="FarmSummaryItem--tradingFeeAPR"
              left="Trading Fees APR"
              right={(
                <BeforeAfter 
                  before={`${tradingFeeBefore}%`}
                  after={`${tradingFeeAfter}%`}
                />
              )}
            />
            <FarmSummaryItem
              className="FarmSummaryItem--klevaRewardsAPR"
              left="KLEVA Rewards APR"
              right={`${klevaRewardAPR}%`}
            />
            <FarmSummaryItem
              className="FarmSummaryItem--borrowingInterestAPR"
              left="Borrowing Interest APR"
              right={`${borrowingInterestAPR}%`}
            />
            <FarmSummaryItem 
              className="FarmSummaryItem--totalAPR"
              left="Total APR"
              right={<BeforeAfter 
                  before={`${totalAPRBefore.toLocaleString('en-us', { maximumFractionDigits: 2 })}%`} 
                  after={`${totalAPRAfter.toLocaleString('en-us', { maximumFractionDigits: 2 })}%`} 
                />}
            />
            <FarmSummaryItem 
              className="FarmSummaryItem--totalAPY"
              left="Total APY"
              right={<BeforeAfter 
                before={`${totalAPYBefore.toLocaleString('en-us', { maximumFractionDigits: 2 })}%`} 
                after={`${totalAPYAfter.toLocaleString('en-us', { maximumFractionDigits: 2 })}%`}
              />}
            />
            <div className="FarmSummary__line" />
            <FarmSummaryItem
              left="Assets Supplied"
              leftSub="Equity Value before Fees"
              right={`${farmingTokenSupplied || 0} ${farmingToken.title} + ${baseTokenSupplied || 0} ${baseToken.title}`}
            />
            <FarmSummaryItem
              left="Assets Borrowed"
              leftSub="Debt Value"
              right={`${borrowingAmount} ${borrowingAsset && borrowingAsset.title}`}
            />
            <FarmSummaryItem
              left="Price Impact & Trading Fees"
              right={`${priceImpact && Number(priceImpact * 100).toLocaleString('en-us', { maximumFractionDigits: 2 }) || 0}%`}
            />
            <FarmSummaryItem
              left="Total Assets in Position Value"
              right={`${farmingTokenPositionValue || 0} ${farmingToken.title} + ${baseTokenPositionValue || 0} ${baseToken.title}`}
            />
            {/* <FarmSummaryItem
              left="Share of Pool"
              leftSub="KLEVA Finance"
              right={shareOfPool}
            />
            <FarmSummaryItem
              left="Share of Pool"
              leftSub="KLAYswap"
              right={shareOfPool}
            /> */}
        </div>
      </div>
    )
  }
}

export default FarmSummary