import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import './LYFPrice.scss'

class LYFPrice extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    
  }
  
  componentWillUnMount() {
    this.destroy$.next(true)
  }
    
  render() {
    const _price = 31.84

    return (
      <div className="LYFPrice">
        <div className="LYFPrice__image" />
        <span className="LYFPrice__value">${_price.toLocaleString('en-us', { maximumFractionDigits: 2 })}</span>
      </div>
    )
  }
}

export default LYFPrice