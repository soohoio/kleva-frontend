import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import './LYFPrice.scss'
import { tokenPrices$ } from '../streams/tokenPrice'
import { tokenList } from '../constants/tokens'

class LYFPrice extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      tokenPrices$,
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })
  }
  
  componentWillUnMount() {
    this.destroy$.next(true)
  }
    
  render() {
    const _price = Number(tokenPrices$.value && tokenPrices$.value[tokenList.KLEVA.address] || 0)

    return (
      <div className="LYFPrice">
        <div className="LYFPrice__image" />
        <span className="LYFPrice__value">${_price.toLocaleString('en-us', { maximumFractionDigits: 2 })}</span>
      </div>
    )
  }
}

export default LYFPrice