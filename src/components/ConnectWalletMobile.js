import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import './ConnectWalletMobile.scss'
import { selectedAddress$ } from '../streams/wallet'
import { openModal$ } from '../streams/ui'
import ConnectWalletPopup from './ConnectWalletPopup'

class ConnectWalletMobile extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      selectedAddress$,
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
    
    return (
      <div 
        className="ConnectWalletMobile"
      >
        <img
          onClick={() => {
            openModal$.next({ component: <ConnectWalletPopup /> })
          }}
          className="ConnectWalletMobile__icon"
          src={selectedAddress$.value 
            ? "/static/images/wallet-connected.svg"
            : "/static/images/wallet-disconnected.svg"
          }
        />
      </div>
    )
  }
}

export default ConnectWalletMobile