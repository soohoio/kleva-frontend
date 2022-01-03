import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import './MinimizeTradingSummary.scss'

class MinimizeTradingSummary extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    
  }
  
  componentWillUnMount() {
    this.destroy$.next(true)
  }
    
  render() {
    const {
      positionValue$,
      equityValue$,
      debtValue$,
    } = this.props

    const positionValue = positionValue$.value
    const equityValue = equityValue$.value
    const debtValue = debtValue$.value
    
    return (
      <div className="MinimizeTradingSummary">
        {/* <FarmSummaryItem
          left="Position Value Assets"
          leftSub={`1 ${farmingToken.title} = 1 ${baseToken.title} | 1 ${baseToken.title} = 1 ${farmingToken.title}`}
          right={`${farmingTokenPositionValue} ${farmingToken.title} + ${baseTokenPositionValue} ${baseToken.title}`}
        /> */}
        {/* <FarmSummaryItem
          left="Amount to Trade"
          right={`${farmingTokenPositionValue} ${farmingToken.title}`}
        />
        <FarmSummaryItem
          left="Price Impact & Trading Fees"
          leftSub="Percent Impact calculated based on our equity value"
          right={`${priceImpact} ${farmingToken.title}`}
          rightSub={`${priceImpact}%`}
        />
        <FarmSummaryItem
          left="Converted Position Value Assets"
          right={`${convertedPositionValueInBaseToken} ${baseToken.title}`}
        />
        <FarmSummaryItem
          left="Debt Value"
          right={`${borrowingAmount} ${borrowingAsset.title}`}
        />
        <div className="ConvertToBaseTokenSummary__line" />
        <FarmSummaryItem
          left="You'll approximately receive"
          leftSub="Minimum received"
          right={`${approxReceiveFarmingTokenAmount} ${farmingToken.title} + ${approxReceiveBaseTokenAmount} ${baseToken.title}`}
        /> */}
      </div>
    )
  }
}

export default MinimizeTradingSummary