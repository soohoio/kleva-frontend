import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import './TVL.scss'

class TVL extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    
  }
  
  componentWillUnMount() {
    this.destroy$.next(true)
  }
    
  render() {
    const _tvl = 1204873354.73

    return (
      <div className="TVL">
        <span className="TVL__label">TVL</span>
        <span className="TVL__value">${_tvl.toLocaleString('en-us', { maximumFractionDigits: 2 })}</span>
      </div>
    )
  }
}

export default TVL