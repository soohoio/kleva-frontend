import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, interval, forkJoin } from 'rxjs'
import { startWith, switchMap, takeUntil, tap } from 'rxjs/operators'

import PageBuilder from './PageBuilder'

import MyPositions from 'components/MyPositions'
import FarmList from '../components/FarmList'

import './FarmPage.scss'
import { getFarmDeposited$, getKlevaAnnualReward$, getPoolReserves$, getWorkerInfo$ } from '../streams/contract'
import { workers } from '../constants/workers'
import { workerInfo$ } from 'streams/farming'
import { aprInfo$, farmPoolDeposited$, fetchPoolReserves$, poolReserves$ } from '../streams/farming'
import { debtTokens, lpTokens } from '../constants/tokens'
import { stakingPools } from '../constants/stakingpool'
import { farmPool } from '../constants/farmpool'

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