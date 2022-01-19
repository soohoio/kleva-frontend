import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import './FarmSummaryItem.scss'

class FarmSummaryItem extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }
    
  render() {
    const { className, left, leftSub, right, rightSub } = this.props
    return (
      <div className={cx("FarmSummaryItem", className)}>
        <div className="FarmSummaryItem__left">
          {left}
          {!!leftSub && <div className="FarmSummaryItem__leftSub">{leftSub}</div>}
        </div>
        <div className="FarmSummaryItem__right">
          {right}
          {!!rightSub && <div className="FarmSummaryItem__rightSub">{rightSub}</div>}
        </div>
      </div>
    )
  }
}

export default FarmSummaryItem