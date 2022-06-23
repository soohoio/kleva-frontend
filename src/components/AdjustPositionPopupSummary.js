import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import BigNumber from 'bignumber.js'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import './AdjustPositionPopupSummary.scss'

import FarmSummaryItem from './FarmSummaryItem'
import DetailedHideable from './DetailedHideable'
import BeforeAfter from './BeforeAfter'
import { nFormatter } from '../utils/misc'
import { toAPY } from '../utils/calc'
import { getOutputTokenAmount$ } from '../streams/contract'

class AdjustPositionPopupSummary extends Component {
  destroy$ = new Subject()

  componentDidMount() {

  }

  componentWillUnmount() {
    this.destroy$.next(true)
  }

  render() {
    const {
      farmingTokenAmount,
      baseTokenAmount,
      borrowingAmount,
      farmingToken,
      baseToken,
      priceImpact,
      leverageImpact,
      showDetail$,
      afterPositionValue,
      debtValueBefore,
      amountToBeBorrowed,

      yieldFarmingBefore,
      yieldFarmingAfter,

      safetyBufferBefore,
      safetyBufferAfter,

      userFarmingTokenBefore,
      userBaseTokenBefore,
      userFarmingTokenAmountToAdd,
      userBaseTokenAmountToAdd,

      newDebtValue,

      finalPositionIngredientBaseTokenAmount,
      finalPositionIngredientFarmingTokenAmount,
      borrowMore,
    } = this.props

    const amountToBeBorrowedParsed = new BigNumber(amountToBeBorrowed)
      .div(10 ** baseToken.decimals)
      .toNumber()
    
    const debtValueAfter = new BigNumber(debtValueBefore)
      .plus(amountToBeBorrowedParsed)
      .toNumber()

    return (
      <DetailedHideable 
        title="Summary" 
        showDetail$={showDetail$} 
        className={cx("AdjustPositionPopupSummary", {
          "AdjustPositionPopupSummary--borrowMore": borrowMore,
        })}
      >
        <FarmSummaryItem
          left="Assets to be Borrowed"
          right={`${nFormatter(amountToBeBorrowedParsed, 4) || 0} ${baseToken.title}`}
        />
        <FarmSummaryItem
          left="Updated Debt Value"
          right={(
            <BeforeAfter
              before={`${nFormatter(debtValueBefore, 4)}`}
              after={`${nFormatter(debtValueAfter, 4)}`}
            />
          )}
        />
        <FarmSummaryItem
          left="Yield Farming"
          leftSub="Leverage"
          right={(
            <BeforeAfter
              before={`${nFormatter(yieldFarmingBefore, 2)}%`}
              after={`${nFormatter(yieldFarmingAfter, 2)}%`}
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
        <hr className="AdjustPositionPopupSummary__hr" />
        <FarmSummaryItem
          left="Total Assets Supplied"
          leftSub="Equity Value before Fees"
          right={`
              ${nFormatter(
              new BigNumber(userFarmingTokenBefore)
                .plus(userFarmingTokenAmountToAdd || 0)
                .toNumber(), 6) || 0} ${farmingToken && farmingToken.title} 
              + 
              ${nFormatter(new BigNumber(userBaseTokenBefore)
                  .plus(userBaseTokenAmountToAdd || 0)
                  .toNumber(), 6) || 0} ${baseToken.title}`
            }
        />
        <FarmSummaryItem
          left="Total Assets Borrowed"
          leftSub="Debt Value"
          right={`${nFormatter(
              new BigNumber(newDebtValue).div(10 ** baseToken.decimals).toNumber(), 4)
            } ${baseToken && baseToken.title}`}
        />
        <FarmSummaryItem
          left="Price Impact"
          right={`${priceImpact && !isNaN(priceImpact) && Number(priceImpact * 100).toLocaleString('en-us', { maximumFractionDigits: 2 }) || 0}%`}
        />
        <FarmSummaryItem
          className="LeverageImpact"
          left="Leverage Impact"
          right={`${leverageImpact && !isNaN(leverageImpact) && Number(leverageImpact * 100).toLocaleString('en-us', { maximumFractionDigits: 2 }) || 0}%`}
        />
        <FarmSummaryItem
          left="Total Assets in Position Value"
          right={`${nFormatter(finalPositionIngredientFarmingTokenAmount || 0, 6)} ${farmingToken.title} + ${nFormatter(finalPositionIngredientBaseTokenAmount || 0, 6)} ${baseToken.title}`}
        />
      </DetailedHideable>
    )
  }
}

export default AdjustPositionPopupSummary