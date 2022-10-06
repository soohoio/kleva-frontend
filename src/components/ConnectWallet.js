import React, { Component } from 'react'
import cx from 'classnames'
import { Subject, merge, fromEvent, BehaviorSubject, timer } from 'rxjs'
import { debounceTime, skip, filter, switchMap, takeUntil } from 'rxjs/operators'

import { I18n } from 'components/common/I18n'
import { selectedAddress$ } from 'streams/wallet'
import { openModal$ } from 'streams/ui'

import './ConnectWallet.scss'
import ConnectWalletPopup from './ConnectWalletPopup'
import { knsDomain$, logout$, walletProviderName$ } from '../streams/wallet'
import copy from 'copy-to-clipboard'

class ConnectWallet extends Component {
  destroy$ = new Subject()

  copied$ = new BehaviorSubject()
  copiedHide$ = new BehaviorSubject()

  componentDidMount() {
    merge(
      selectedAddress$,
      knsDomain$,
      walletProviderName$,
      this.copied$,
      this.copiedHide$,
    ).pipe(
      debounceTime(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })

    this.copied$.pipe(
      filter((copied) => !!copied), // only when copied true
      switchMap(() => {
        return timer(1.5 * 1000).pipe(
          takeUntil(this.copied$.pipe(skip(1))),
        )
      }),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.copied$.next(false)
      this.copiedHide$.next(true)
    })
  }

  componentWillUnmount() {
    this.destroy$.next(true)
  }

  copy = (copyTarget) => {
    this.copied$.next(true)
    copy(copyTarget)
  }

  render() {
    const { className } = this.props

    const addressDisplay = knsDomain$.value || (selectedAddress$.value?.slice(0, 4) + "..." + selectedAddress$.value?.slice(-4))

    return (
      <div
        onClick={() => {
          // Disconnect
          if (selectedAddress$.value) {
            return
          }

          openModal$.next({
            classNameAttach: "Modal--mobileCoverAll",
            component: <ConnectWalletPopup />
          })
        }}
        className={cx("ConnectWallet", className, {
          "ConnectWallet--connected": !!selectedAddress$.value,
        })}
      >
        <span className="ConnectWallet__message">
          {selectedAddress$.value 
            ? (
              <div 
                onClick={() => {
                  this.copy(knsDomain$.value || selectedAddress$.value)
                }}
                onMouseEnter={() => this.copiedHide$.next(false)}
                onMouseLeave={() => this.copied$.next(false)}
                className="ConnectWallet__walletAddress"
              >
                <img className="ConnectWallet__walletProviderIcon" src={`/static/images/common/icon_wallet_${walletProviderName$.value?.toLowerCase()}.svg`} />
                <div className="ConnectWallet__walletDisplay">
                  {addressDisplay}
                  <p className={cx("ConnectWallet__copyMessage", {
                    "ConnectWallet__copyMessage--copied": this.copied$.value,
                    "ConnectWallet__copyMessage--copiedHide": this.copiedHide$.value,
                  })}>
                    {this.copied$.value ? I18n.t('copied') : I18n.t('copyAddress')}
                  </p>
                </div>
              </div>
            )
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