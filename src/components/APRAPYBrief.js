import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import FarmSummaryItem from './FarmSummaryItem'

import './APRAPYBrief.scss'
import { toAPY } from '../utils/calc'
import BeforeAfter from './BeforeAfter'
import Checkbox from './common/Checkbox'

class APRAPYBrief extends Component {
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
      showDetail$,

      yieldFarmingBefore,
      yieldFarmingAfter,

      tradingFeeBefore,
      tradingFeeAfter,
      
      klevaRewardsAPRBefore,
      klevaRewardsAPRAfter,

      borrowingInterestAPRBefore,
      borrowingInterestAPRAfter,
    } = this.props

    return (
      <div className="APRAPYBrief__wrapper">
        <div className="APRAPYBrief">
          <FarmSummaryItem
            className="APRAPYBrief__apy"
            left="Total APY"
            right={(
              <BeforeAfter
                before={`${nFormatter(toAPY(totalAPRBefore), 2)}%`}
                after={`${nFormatter(toAPY(totalAPRAfter), 2)}%`}
              />
            )}
          />
          <FarmSummaryItem
            className="APRAPYBrief__apr"
            left="Total APR"
            right={(
              <BeforeAfter
                before={`${nFormatter(totalAPRBefore, 2)}%`}
                after={`${nFormatter(totalAPRAfter, 2)}%`}
              />
            )}
          />
          {showDetail$.value && (
            <div className="APRAPYBrief__aprDetail">
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
          )}
        </div>
        <Checkbox
          label="Detailed"
          checked$={showDetail$}
        />
      </div>
    )
  }
}

export default APRAPYBrief