import React, { Component, Fragment, createRef } from 'react'
import BigNumber from 'bignumber.js'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import './BorrowMore.scss'
import Checkbox from './common/Checkbox'
import LeverageGauge from './LeverageGauge'

class BorrowMore extends Component {
  destroy$ = new Subject()

  componentDidMount() {
    
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }
    
  render() {
    const { 
      borrowingAsset, 
      leverage$, 
      leverageCap,
      equityValue,
      debtValue,
    } = this.props

    const currentPositionLeverage = new BigNumber(equityValue)
      .plus(debtValue)
      .div(equityValue)
      .toFixed(2)

    return (
      <div className="BorrowMore">
        {/* <div className="BorrowMore__header">
          <div className="BorrowMore__assetInfo">
            <img className="BorrowMore__assetIcon" src={borrowingAsset.iconSrc} />
            <span className="BorrowMore__assetTitle">{borrowingAsset.title}</span>
          </div>
        </div> */}
        <LeverageGauge
          leverageMin={currentPositionLeverage}
          title="Target Position Leverage"
          description={`Current Position Leverage ${currentPositionLeverage}x`}
          leverage$={leverage$}
          leverageCap={leverageCap}
        />
      </div>
    )
  }
}

export default BorrowMore