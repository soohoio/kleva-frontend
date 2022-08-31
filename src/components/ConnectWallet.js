import React, { Component } from 'react'
import cx from 'classnames'
import { Subject, merge, fromEvent } from 'rxjs'
import { debounceTime, takeUntil } from 'rxjs/operators'

import { I18n } from 'components/common/I18n'
import { selectedAddress$ } from 'streams/wallet'
import { openModal$ } from 'streams/ui'

import './ConnectWallet.scss'
import ConnectWalletPopup from './ConnectWalletPopup'
import { logout$, walletProviderName$ } from '../streams/wallet'

class ConnectWallet extends Component {
  destroy$ = new Subject()

  componentDidMount() {
    merge(
      selectedAddress$,
      walletProviderName$,
    ).pipe(
      debounceTime(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
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
        <span className="ConnectWallet__message">
          {selectedAddress$.value 
            ? I18n.t('connected', { title: walletProviderName$.value }) 
            : I18n.t('connectWallet')
          }
        </span>
        {selectedAddress$.value && (
          <span 
            onClick={() => {
              logout$.next(true)
            }}
            className="ConnectWallet__logout"
          >
            {I18n.t('logout')}
          </span>
        )}
      </div>
    )
  }
}

export default ConnectWallet