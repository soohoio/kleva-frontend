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
      showDetail$,
      afterPositionValue,
      debtValueBefore,
      amountToBeBorrowed,
    } = this.props

    
    const amountToBeBorrowedParsed = new BigNumber(amountToBeBorrowed)
    .div(10 ** baseToken.decimals)
    .toNumber()
    
    const debtValueAfter = new BigNumber(debtValueBefore)
    .plus(amountToBeBorrowedParsed)
    .toNumber()
    
    return (
      <DetailedHideable title="Summary" showDetail$={showDetail$} className="AdjustPositionPopupSummary">
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
        {/* <FarmSummaryItem
          left="Updated Debt Value"
          right={`${nFormatter(baseTokenAmount, 4) || 0} ${baseToken.title}`}
        />
        <FarmSummaryItem
          left="Yield Farming"
          leftSub="Leverage"
          right={`${nFormatter(baseTokenAmount, 4) || 0} ${baseToken.title}`}
        />
        <FarmSummaryItem
          left="Updated Safety Buffer"
          right={`${nFormatter(baseTokenAmount, 4) || 0} ${baseToken.title}`}
        />
        <hr /> */}
        {/* <FarmSummaryItem
          left="Total Assets Supplied"
          leftSub="Equity Value before Fees"
          right={`${nFormatter(farmingTokenAmount, 4) || 0} ${farmingToken && farmingToken.title} + ${nFormatter(baseTokenAmount, 4) || 0} ${baseToken.title}`}
        />
        <FarmSummaryItem
          left="Total Assets Borrowed"
          leftSub="Debt Value"
          right={`${nFormatter(borrowingAmount, 4)} ${baseToken && baseToken.title}`}
        />
        <FarmSummaryItem
          left="Price Impact & Trading Fees"
          right={`${priceImpact && Number(priceImpact * 100).toLocaleString('en-us', { maximumFractionDigits: 2 }) || 0}%`}
        />
        <FarmSummaryItem
          left="Total Assets in Position Value"
          right={`${nFormatter(afterPositionValue && afterPositionValue.farmingTokenAmount || 0, 4)} ${farmingToken.title} + ${nFormatter(afterPositionValue && afterPositionValue.baseTokenAmount || 0, 4)} ${baseToken.title}`}
        /> */}
      </DetailedHideable>
    )
  }
}

export default AdjustPositionPopupSummary