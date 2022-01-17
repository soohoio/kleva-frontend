import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import BigNumber from 'bignumber.js'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import './PartialClosePositionPopupSummary.scss'

import FarmSummaryItem from './FarmSummaryItem'
import DetailedHideable from './DetailedHideable'
import BeforeAfter from './BeforeAfter'
import { nFormatter } from '../utils/misc'
import { toAPY } from '../utils/calc'
import { getOutputTokenAmount$ } from '../streams/contract'

class PartialClosePositionPopupSummary extends Component {
  destroy$ = new Subject()

  componentDidMount() {

  }

  componentWillUnmount() {
    this.destroy$.next(true)
  }

  render() {
    const {
      farmingToken,
      baseToken,

      yieldFarmingBefore,
      yieldFarmingAfter,

      tradingFeeAPRBefore,
      tradingFeeAPRAfter,

      klevaRewardsAPRBefore,
      klevaRewardsAPRAfter,

      borrowingInterestAPRBefore,
      borrowingInterestAPRAfter,

      totalAPRBefore,
      totalAPRAfter,

      userFarmingTokenBefore,
      userBaseTokenBefore,

      finalPositionIngredientBaseTokenAmount,
      finalPositionIngredientFarmingTokenAmount,

      debtValueBefore,
      debtValutAfter,

      debtRatioBefore,
      debtRatioAfter,

      safetyBufferBefore,
      safetyBufferAfter,
    } = this.props

    return (
      <DetailedHideable
        title="Details"
        className={cx("PartialClosePositionPopupSummary")}
        alwaysShow
      >
        <FarmSummaryItem
          left="Updated Position Value Assets"
          right={(
            <BeforeAfter
              before={`${nFormatter(userFarmingTokenBefore, 4)} ${farmingToken.title} + ${nFormatter(userBaseTokenBefore, 4)} ${baseToken.title}`}
              after={`${nFormatter(finalPositionIngredientFarmingTokenAmount, 4)} ${farmingToken.title} + ${nFormatter(finalPositionIngredientBaseTokenAmount, 4)} ${baseToken.title}`}
            />
          )}
        />
        <hr className="PartialClosePositionPopupSummary__hr" />
        <FarmSummaryItem
          left="Updated Debt Value"
          right={(
            <BeforeAfter
              before={`${nFormatter(debtValueBefore, 4)}`}
              after={`${nFormatter(debtValutAfter, 4)}`}
            />
          )}
        />
        <FarmSummaryItem
          left="Updated Debt Ratio"
          leftSub="Leverage"
          right={(
            <BeforeAfter
              before={`${nFormatter(debtRatioBefore, 2)}%`}
              after={`${nFormatter(debtRatioAfter, 2)}%`}
            />
          )}
        />
        <FarmSummaryItem
          left="Updated Safety Buffer"
          right={(
            <BeforeAfter
              before={`${nFormatter(safetyBufferBefore, 2)}%`}
              after={`${nFormatter(safetyBufferAfter, 2)}%`}
            />
          )}
        />
        <FarmSummaryItem
          left="Total APY"
          right={(
            <BeforeAfter
              before={`${nFormatter(toAPY(totalAPRBefore), 2)}%`}
              after={`${nFormatter(toAPY(totalAPRAfter), 2)}%`}
            />
          )}
        />
        <FarmSummaryItem
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
          <FarmSummaryItem
            className="FarmSummaryItem--tradingFeeAPR"
            left="Trading Fees APR"
            right={(
              <BeforeAfter
                before={`${nFormatter(tradingFeeAPRBefore, 2)}%`}
                after={`${nFormatter(tradingFeeAPRAfter, 2)}%`}
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
      </DetailedHideable>
    )
  }
}

export default PartialClosePositionPopupSummary