import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import BigNumber from 'bignumber.js'
import { Subject, merge, interval } from 'rxjs'
import { takeUntil, tap, filter, switchMap, startWith } from 'rxjs/operators'

import './GTEarned.scss'
import { getPendingGT$ } from '../streams/contract'
import { stakingPools } from '../constants/stakingpool'
import { selectedAddress$ } from '../streams/wallet'
import { pendingGT$ } from '../streams/vault'

const getPendingGTInterval$ = (account) => interval(1000 * 5).pipe(
  startWith(0),
  switchMap(() => getPendingGT$(stakingPools, account)),
  tap((pendingGT) => {
    pendingGT$.next(pendingGT)
  })
)

class GTEarned extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      selectedAddress$.pipe(
        filter((a) => !!a),
        switchMap(() => getPendingGTInterval$(selectedAddress$.value)),
      ),
      pendingGT$,
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })
  }

  
  componentWillUnMount() {
    this.destroy$.next(true)
  }

  getTotal = () => {
    const total = pendingGT$.value && Object.values(pendingGT$.value).reduce((acc, cur) => {
      acc = new BigNumber(acc).plus(new BigNumber(cur).div(10 ** 18)).toString()
      return acc
    }, new BigNumber(0))

    return total
  }
    
  render() {
    const total = this.getTotal()

    return (
      <div className="GTEarned">
        <div className="GTEarned__left">
          <p className="GTEarned__label">Total KLEVA Earned</p>
          <p className="GTEarned__value">{Number(total).toLocaleString('en-us', { maximumFractionDigits: 4 })}</p>
        </div>
        <div className="GTEarned__right">
          <img className="GTEarned__image" src="/static/images/icon-earned.svg" />
        </div>
      </div>
    )
  }
}

export default GTEarned