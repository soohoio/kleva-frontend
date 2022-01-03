import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import FarmSummaryItem from 'components/FarmSummaryItem'

import './ConvertToBaseTokenSummary.scss'

class ConvertToBaseTokenSummary extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    
  }
  
  componentWillUnMount() {
    this.destroy$.next(true)
  }
    
  render() {
    const { 
      farmingTokenPositionValue, 
      baseTokenPositionValue, 
      farmingToken, 
      baseToken,
      priceImpact,
      borrowingAsset,
      borrowingAmount,
    } = this.props
    
    const convertedPositionValueInBaseToken = 3000
    const approxReceiveFarmingTokenAmount = 2000
    const approxReceiveBaseTokenAmount = 1500

    return (
      <div className="ConvertToBaseTokenSummary">
        <FarmSummaryItem
          left="Position Value Assets"
          leftSub={`1 ${farmingToken.title} = 1 ${baseToken.title} | 1 ${baseToken.title} = 1 ${farmingToken.title}`}
          right={`${farmingTokenPositionValue} ${farmingToken.title} + ${baseTokenPositionValue} ${baseToken.title}`}
        />
        <FarmSummaryItem
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
        />
      </div>
    )
  }
}

export default ConvertToBaseTokenSummary