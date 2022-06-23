import React, { Component } from 'react'
import cx from 'classnames'
import { Subject, merge, fromEvent } from 'rxjs'
import { debounceTime, takeUntil } from 'rxjs/operators'

import { I18n } from 'components/common/I18n'
import { selectedAddress$ } from 'streams/wallet'
import { openModal$ } from 'streams/ui'

import './ConnectWallet.scss'
import ConnectWalletPopup from './ConnectWalletPopup'
import { logout$ } from '../streams/wallet'

class ConnectWallet extends Component {
  destroy$ = new Subject()

  componentDidMount() {
    merge(
      selectedAddress$,
    ).pipe(
      debounceTime(1),
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
    const { className } = this.props

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
        className={cx("ConnectWallet", className, {
          "ConnectWallet--connected": !!selectedAddress$.value,
        })}
      >
        {selectedAddress$.value && (
          <img className="ConnectWallet__disconnect" src="/static/images/close.svg" />
        )}
        <span className="ConnectWallet__message">{displayAddress || I18n.t('connectWallet')}</span>
      </div>
    )
  }
}

export default ConnectWallet