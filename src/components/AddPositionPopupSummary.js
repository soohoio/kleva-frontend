import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import './AddPositionPopupSummary.scss'

import FarmSummaryItem from './FarmSummaryItem'
import DetailedHideable from './DetailedHideable'
import BeforeAfter from './BeforeAfter'
import { nFormatter } from '../utils/misc'
import { toAPY } from '../utils/calc'

class AddPositionPopupSummary extends Component {
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
    } = this.props

    return (
      <DetailedHideable title="Summary" showDetail$={showDetail$} className="AddPositionPopupSummary">
        <FarmSummaryItem
          left="Assets Supplied"
          leftSub="Equity Value before Fees"
          right={`${nFormatter(farmingTokenAmount, 4) || 0} ${farmingToken && farmingToken.title} + ${nFormatter(baseTokenAmount, 4) || 0} ${baseToken.title}`}
        />
        <FarmSummaryItem
          left="Assets Borrowed"
          leftSub="Debt Value"
          right={`${nFormatter(borrowingAmount, 4)} ${baseToken && baseToken.title}`}
        />
        <FarmSummaryItem
          left="Price Impact"
          right={`${priceImpact && Number(priceImpact * 100).toLocaleString('en-us', { maximumFractionDigits: 2 }) || 0}%`}
        />
        <FarmSummaryItem
          className="LeverageImpact"
          left="Leverage Impact"
          right={`${leverageImpact && Number(leverageImpact * 100).toLocaleString('en-us', { maximumFractionDigits: 2 }) || 0}%`}
        />
        <FarmSummaryItem
          left="Total Assets in Position Value"
          right={`${nFormatter(afterPositionValue && afterPositionValue.farmingTokenAmount || 0, 4)} ${farmingToken.title} + ${nFormatter(afterPositionValue && afterPositionValue.baseTokenAmount || 0, 4)} ${baseToken.title}`}
        />
      </DetailedHideable>
    )
  }
}

export default AddPositionPopupSummary