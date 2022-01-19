import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { from, Subject, merge, fromEvent } from 'rxjs'
import { take, takeUntil, tap } from 'rxjs/operators'

import { selectedAddress$, connectInjected } from 'streams/wallet'
import { accessKlip$ } from 'streams/klip'
import { walletType$ } from 'streams/setting'
import { openModal$, closeModal$ } from 'streams/ui'


import './ConnectWallet.scss'
import KlipQRCode from './KlipQRCode'
import ConnectWalletPopup from './ConnectWalletPopup'
import { logout$ } from '../streams/wallet'

class ConnectWallet extends Component {
  destroy$ = new Subject()

  componentDidMount() {
    merge(
      selectedAddress$,
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })

    fromEvent(window, 'click').pipe(
      takeUntil(this.destroy$)
    ).subscribe((e) => {
      if (e && e.target.className.indexOf("ConnectWallet") === -1) {
        this.setState({ isExpand: false })
      }
    })
  }

  componentWillUnmount() {
    this.destroy$.next(true)
  }

  render() {
    const displayAddress = selectedAddress$.value &&
      (selectedAddress$.value.slice(0, 6) + "..." + selectedAddress$.value.slice(-4))

    return (
      <div
        onClick={() => {
          // Disconnect
          if (selectedAddress$.value) {
            logout$.next(true)
            return
          }

          openModal$.next({
            component: <ConnectWalletPopup />
          })
        }}
        className={cx("ConnectWallet", {
          "ConnectWallet--connected": !!selectedAddress$.value,
        })}
      >
        {selectedAddress$.value && (
          <img className="ConnectWallet__disconnect" src="/static/images/close.svg" />
        )}
        <span className="ConnectWallet__message">{displayAddress || "Connect Wallet"}</span>
      </div>
    )
  }
}

export default ConnectWallet