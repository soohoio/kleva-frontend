import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import './GTWalletBalance.scss'
import { balancesInWallet$ } from '../streams/wallet'
import { tokenList } from '../constants/tokens'
import BigNumber from 'bignumber.js'

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
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }
    
  render() {
    const { klevaPrice } = this.props
    
    // const gt = tokenList.ALPACA
    const gt = tokenList.KLEVA
    const gtBalance = balancesInWallet$.value 
      && balancesInWallet$.value[gt.address]
      && balancesInWallet$.value[gt.address].balanceParsed || 0

    return (
      <div className="GTWalletBalance">
        <div className="GTWalletBalance__left">
          <p className="GTWalletBalance__label">KLEVA in My Wallet</p>
          <p className="GTWalletBalance__value">{Number(gtBalance).toLocaleString('en-us', { maximumFractionDigits: 2 })}</p>
          <p className="GTWalletBalance__valueInUSD">
            ~ ${new BigNumber(gtBalance)
            .multipliedBy(klevaPrice)
            .toNumber()
            .toLocaleString('en-us', { maximumFractionDigits: 2 })
          }</p>
        </div>
        <div className="GTWalletBalance__right">
          <img className="GTWalletBalance__image" src="/static/images/icon-gt-balance.svg" />
        </div>
      </div>
    )
  }
}

export default GTWalletBalance