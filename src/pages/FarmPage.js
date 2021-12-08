import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, interval, forkJoin } from 'rxjs'
import { startWith, switchMap, takeUntil, tap } from 'rxjs/operators'

import PageBuilder from './PageBuilder'

import MyPositions from 'components/MyPositions'
import FarmList from '../components/FarmList'

import './FarmPage.scss'
import { getPoolReserves$, getWorkerInfo$ } from '../streams/contract'
import { workers } from '../constants/workers'
import { workerInfo$ } from 'streams/farming'
import { aprInfo$, fetchPoolReserves$, getAPRInfo$, poolReserves$ } from '../streams/farming'
import { lpTokens } from '../constants/tokens'

class FarmPage extends Component {
  destroy$ = new Subject()

  componentDidMount() {

    // interval: 10s get pool reserves
    merge(
      interval(1000 * 10).pipe(
        startWith(0),
      ),
      fetchPoolReserves$,
    ).pipe(
      switchMap(() => getPoolReserves$(Object.values(lpTokens))),
      takeUntil(this.destroy$)
    ).subscribe((poolReserves) => {
      poolReserves$.next(poolReserves)
    })

    interval(1000 * 60).pipe(
      startWith(0)
    ).pipe(
      switchMap(() => {
        return forkJoin(
          getWorkerInfo$(workers),
          getAPRInfo$(),
        )
      }),
      tap(([workerInfo, aprInfo]) => {

        const _workerInfo = Object.entries(workerInfo).reduce((acc, [key, item]) => {
          acc[key.toLowerCase()] = item
          acc[key] = item
          return acc
        }, {})

        workerInfo$.next(_workerInfo)

        aprInfo$.next(aprInfo)
      }),
      takeUntil(this.destroy$)
    ).subscribe()
  }

  componentWillUnMount() {
    this.destroy$.next(true)
  }

  render() {

    return (
      <PageBuilder>
        <div className="FarmPage">
          <MyPositions />
          <FarmList />
        </div>
      </PageBuilder>
    )
  }
}

export default FarmPage