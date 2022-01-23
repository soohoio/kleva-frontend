import React, { Component, Fragment, createRef } from 'react'
import BigNumber from 'bignumber.js'
import cx from 'classnames'
import { Subject, merge, interval, of, BehaviorSubject } from 'rxjs'
import { debounceTime, startWith, switchMap, takeUntil, tap } from 'rxjs/operators'

import './LockedKLEVA.scss'
import { fetchUnlockAmount$, lockedKlevaAmount$, selectedAddress$, unlockableKlevaAmount$ } from '../streams/wallet'
import { calcUnlockableAmount$, getTransactionReceipt$, unlock$ } from '../streams/contract'
import { tokenList } from '../constants/tokens'
import { isDesktop$ } from '../streams/ui'

class LockedKLEVA extends Component {
  destroy$ = new Subject()
  isLoading$ = new BehaviorSubject(false)

  componentDidMount() {
    merge(
      isDesktop$,
      lockedKlevaAmount$,
      unlockableKlevaAmount$,
      selectedAddress$,
      this.isLoading$,
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
    const { contentOnly } = this.props
    
    const isDisabled = unlockableKlevaAmount$.value == 0

    return !!selectedAddress$.value && (
      <div 
        className={cx("LockedKLEVA", {
          "LockedKLEVA--contentOnly": contentOnly,
        })}
      >
        {!contentOnly && (
          <div className="LockedKLEVA__header">
            <div className="LockedKLEVA__headerLeft">
              Locked KLEVA
              {/* <span className="LockedKLEVA__airdrop">Airdrop</span> */}
            </div>
            {/* <img className="LockedKLEVA__close" src="/static/images/close-black.svg" /> */}
          </div>
        )}
        <div className="LockedKLEVA__content">
          {/* <p className="LockedKLEVA__pendingAmount">
            {Number(unlockableKlevaAmount$.value)
              .toLocaleString('en-us', { maximumFractionDigits: 8 })}
          </p> */}
          <p className="LockedKLEVA__pendingAmount">
            {Number(lockedKlevaAmount$.value)
              .toLocaleString('en-us', { maximumFractionDigits: 8 })}
          </p>
          <button
            onClick={() => {
              if (isDisabled) {
                return
              }
              unlock$(selectedAddress$.value).pipe(
                tap(() => this.isLoading$.next(true)),
                switchMap((result) => getTransactionReceipt$(result && result.result || result.tx_hash)),
              ).subscribe(() => {
                this.isLoading$.next(false)
                fetchUnlockAmount$.next(true)
              })
            }}
            className={cx("LockedKLEVA__unlockButton", {
              "LockedKLEVA__unlockButton--disabled": isDisabled,
            })}
          >
            {this.isLoading$.value 
              ? "..."
              : "Unlock"
            }
          </button>
        </div>
      </div>
    )
  }
}

export default LockedKLEVA