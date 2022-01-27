import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import './KlevaEarned.scss'
import EarnedPopup from './EarnedPopup'
import { openModal$ } from '../streams/ui'

class KlevaEarned extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      of(true),
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })
    
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }
    
  render() {
    const { earned, className } = this.props
    return (
      <div className={cx("KlevaEarned__KlevaEarned", className)}>
        <div className="KlevaEarned__KlevaEarnedInfo">
          <span className="KlevaEarned__KlevaEarnedValue">{Number(earned).toLocaleString('en-us', { maximumFractionDigits: 4 })}</span>
          <span className="KlevaEarned__KlevaEarnedLabel">KLEVA to Claim</span>
        </div>
        <button onClick={() => openModal$.next({ component: <EarnedPopup /> })} className="KlevaEarned__KleaveEarnedEarnButton">
          Claim
        </button>
      </div>
    )
  }
}

export default KlevaEarned