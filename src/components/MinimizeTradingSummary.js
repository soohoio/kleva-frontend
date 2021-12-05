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
    
    return (
      <div className="MinimizeTradingSummary">
      
      </div>
    )
  }
}

export default MinimizeTradingSummary