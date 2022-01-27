import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import './APRAPYDetailed.scss'

import FarmSummaryItem from './FarmSummaryItem'
import DetailedHideable from './DetailedHideable'
import BeforeAfter from './BeforeAfter'
import { nFormatter } from '../utils/misc'
import { toAPY } from '../utils/calc'

class APRAPYDetailed extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }
    
  render() {
    const { 
      totalAPRBefore, 
      totalAPRAfter,
      
      yieldFarmingBefore,
      yieldFarmingAfter,
      
      tradingFeeBefore,
      tradingFeeAfter,
      
      klevaRewardsAPRBefore,
      klevaRewardsAPRAfter,

      borrowingInterestAPRBefore,
      borrowingInterestAPRAfter,

      showDetail$,
    } = this.props

    return (
      <DetailedHideable title="Detailed APR/APY" showDetail$={showDetail$} className="APRAPYDetailed">
        <FarmSummaryItem
          className="APRAPYDetailed__apy"
          left="Total APY"
          right={(
            <BeforeAfter
              before={`${nFormatter(toAPY(totalAPRBefore), 2)}%`}
              after={`${nFormatter(toAPY(totalAPRAfter), 2)}%`}
            />
          )}
        />
        <FarmSummaryItem
          className="APRAPYDetailed__apy"
          left="Total APR"
          right={(
            <BeforeAfter
              before={`${nFormatter(totalAPRBefore, 2)}%`}
              after={`${nFormatter(totalAPRAfter, 2)}%`}
            />
          )}
        />
        <div className="APRAPYDetailed__aprDetail">
          <FarmSummaryItem
            className="FarmSummaryItem__yieldFarming"
            left="Yield Farming"
            right={(
              <BeforeAfter
                before={`${nFormatter(yieldFarmingBefore, 2)}%`}
                after={`${nFormatter(yieldFarmingAfter, 2)}%`}
              />
            )}
          />
          {tradingFeeBefore != 0 && (
            <FarmSummaryItem
              className="FarmSummaryItem--tradingFeeAPR"
              left="Trading Fees APR"
              right={(
                <BeforeAfter
                  before={`${nFormatter(tradingFeeBefore, 2)}%`}
                  after={`${nFormatter(tradingFeeAfter, 2)}%`}
                />
              )}
            />
          )}
          <FarmSummaryItem
            className="FarmSummaryItem--klevaRewardsAPR"
            left="KLEVA Rewards APR"
            right={(
              <BeforeAfter
                before={`${nFormatter(klevaRewardsAPRBefore, 2)}%`}
                after={`${nFormatter(klevaRewardsAPRAfter, 2)}%`}
              />
            )}
          />
          <FarmSummaryItem
            className="FarmSummaryItem--borrowingInterestAPR"
            left="Borrowing Interest APR"
            right={(
              <BeforeAfter
                before={`${nFormatter(borrowingInterestAPRBefore, 2)}%`}
                after={`${nFormatter(borrowingInterestAPRAfter, 2)}%`}
              />
            )}
          />
        </div>
      </DetailedHideable>
    )
  }
}

export default APRAPYDetailed