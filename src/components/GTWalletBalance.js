import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import './GTWalletBalance.scss'
import { balancesInWallet$ } from '../streams/wallet'
import { tokenList } from '../constants/tokens'

class GTWalletBalance extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      balancesInWallet$
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
    // const gt = tokenList.ALPACA
    const gt = tokenList.KLEVA
    const gtBalance = balancesInWallet$.value 
      && balancesInWallet$.value[gt.address]
      && balancesInWallet$.value[gt.address].balanceParsed

    return (
      <div className="GTWalletBalance">
        <div className="GTWalletBalance__left">
          <p className="GTWalletBalance__label">KLEVA Wallet Balance</p>
          <p className="GTWalletBalance__value">{Number(gtBalance).toLocaleString('en-us', { maximumFractionDigits: 4 })}</p>
        </div>
        <div className="GTWalletBalance__right">
          <img className="GTWalletBalance__image" src="/static/images/icon-gt-balance.svg" />
        </div>
      </div>
    )
  }
}

export default GTWalletBalance