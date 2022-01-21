import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import BigNumber from 'bignumber.js'
import { Subject, merge, interval } from 'rxjs'
import { takeUntil, tap, filter, switchMap, startWith } from 'rxjs/operators'

import './GTEarned.scss'
import { getPendingGTInFairlaunchPool$, getTransactionReceipt$, unlock$ } from '../streams/contract'
import { stakingPools, stakingPoolsByPID } from '../constants/stakingpool'
import { selectedAddress$, pendingGT$, lockedKlevaAmount$, unlockableKlevaAmount$, fetchUnlockAmount$ } from '../streams/wallet'
import { tokenList } from '../constants/tokens'
import { tokenPrices$ } from '../streams/tokenPrice'
import { BehaviorSubject } from 'rxjs'

const modes = [
  "Earned",
  "Locked",
  "Unlockable"
]

class GTEarned extends Component {
  destroy$ = new Subject()
  isLoading$ = new BehaviorSubject()

  // 'Earned', 'Locked', 'Unlockable'
  state = {
    mode: "Earned"
  }
  
  componentDidMount() {
    merge(
      selectedAddress$.pipe(
        filter((a) => !!a),
      ),
      pendingGT$,
      lockedKlevaAmount$,
      unlockableKlevaAmount$,
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })

    fetchUnlockAmount$.next(true)
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }

  setMode = (mode) => {
    this.setState({ mode })
  }

  getTotal = () => {
    const total = pendingGT$.value && Object.entries(pendingGT$.value).reduce((acc, [pid, pendingAmount]) => {
      if (stakingPoolsByPID[pid]) {
        acc = new BigNumber(acc).plus(new BigNumber(pendingAmount).div(10 ** 18)).toString()
      }
      return acc
    }, new BigNumber(0))

    return total
  }

  renderContent = () => {
    const { mode } = this.state
    const { klevaPrice } = this.props
    const total = this.getTotal()

    if (mode === "Earned") {
      return (
        <>
          <p className="GTEarned__value">{Number(total).toLocaleString('en-us', { maximumFractionDigits: 2 })}</p>
          <p className="GTEarned__valueInUSD">
          ~ ${new BigNumber(total).multipliedBy(klevaPrice).toNumber().toLocaleString('en-us', { maximumFractionDigits: 2 })}
          </p>
        </>
      )
    }

    if (mode === "Locked") {
      return (
        <>
          <p className="GTEarned__value">{Number(lockedKlevaAmount$.value).toLocaleString('en-us', { maximumFractionDigits: 6 })}</p>
          <p className="GTEarned__valueInUSD">
            ~ ${new BigNumber(lockedKlevaAmount$.value).multipliedBy(tokenPrices$.value[tokenList.KLEVA.address.toLowerCase()]).toNumber().toLocaleString('en-us', { maximumFractionDigits: 2 })}
          </p>
        </>
      )
    }

    if (mode === "Unlockable") {
      return (
        <>
          <p className="GTEarned__value">{Number(unlockableKlevaAmount$.value).toLocaleString('en-us', { maximumFractionDigits: 6 })}</p>
          <p className="GTEarned__valueInUSD">
            ~ ${new BigNumber(unlockableKlevaAmount$.value).multipliedBy(tokenPrices$.value[tokenList.KLEVA.address.toLowerCase()]).toNumber().toLocaleString('en-us', { maximumFractionDigits: 2 })}
          </p>
        </>
      )
    }
  }
    
  render() {
    const { mode } = this.state
    const { klevaPrice } = this.props
    const total = this.getTotal()

    const isDisabled = unlockableKlevaAmount$.value == 0

    return (
      <div className="GTEarned">
        <div className="GTEarned__left">
          <div className="GTEarned__modeMenu">
            {modes.map((_mode) => {
              const isActive = _mode === mode
              return (
                <div 
                  className={cx("GTEarned__mode", {
                    "GTEarned__mode--active": isActive,
                  })}
                  onClick={() => {
                    this.setState({
                      mode: _mode,
                    })
                  }}
                >
                  {_mode}
                </div>
              )
            })}
          </div> 
          {this.renderContent()}
        </div>
        <div className="GTEarned__right">
          {mode === "Unlockable" 
            ? (
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
                className={cx("GTEarned__unlockButton", {
                  "GTEarned__unlockButton--disabled": isDisabled,
                })}
              >
                Unlock
              </button>
            )
            : (
              <img className="GTEarned__image" src="/static/images/icon-earned.svg" />
            )
          }
        </div>
      </div>
    )
  }
}

export default GTEarned