import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import GTEarned from 'components/GTEarned'
import GTWalletBalance from 'components/GTWalletBalance'

import './StakeHeaderInfo.scss'
import { tokenPrices$ } from '../streams/tokenPrice'
import { tokenList } from '../constants/tokens'

class StakeHeaderInfo extends Component {
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
    
    const klevaPrice = tokenPrices$.value && tokenPrices$.value[tokenList.KLEVA.address.toLowerCase()]

    return (
      <div className="StakeHeaderInfo">
        <GTEarned klevaPrice={klevaPrice} />
        <GTWalletBalance klevaPrice={klevaPrice} />
      </div>
    )
  }
}

export default StakeHeaderInfo