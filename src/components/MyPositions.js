import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of, interval, BehaviorSubject } from 'rxjs'
import { filter, switchMap, distinctUntilChanged, takeUntil, tap, startWith } from 'rxjs/operators'

import PositionList from 'components/PositionList'
import FarmList from './FarmList'

import './MyPositions.scss'
import { logout$, pendingGT$, selectedAddress$ } from '../streams/wallet'
import { getKilledPositions$, getPositions$, getUserPositionSummary$, ITEM_PER_PAGE } from '../streams/graphql'
import { getPositionInfo$ } from '../streams/contract'
import { aprInfo$, workerInfo$, positions$, viewingPositionLatestBlockTime$, userPositionSummary$ } from '../streams/farming'
import Pagination from './Pagination'
import { debtTokens, tokenList } from '../constants/tokens'
import { openModal$ } from '../streams/ui'
import EarnedPopup from './EarnedPopup'

class MyPositions extends Component {
  destroy$ = new Subject()

  // "active", "liquidated"
  view$ = new BehaviorSubject("active")
  page$ = new BehaviorSubject(1)

  componentDidMount() {
    merge(
      pendingGT$,
      selectedAddress$.pipe(
        filter((a) => !!a),
        switchMap(() => {
          return merge(
            this.page$,
            this.view$,
            interval(5000)
          ).pipe(
            startWith(0),
            switchMap(() => {
              return this.view$.value === "active" 
                ? getPositions$(selectedAddress$.value, this.page$.value)
                : getKilledPositions$(selectedAddress$.value, this.page$.value)
            }),
            switchMap((positions) => { return getPositionInfo$(positions) }),
            tap((positions) => {
              const positionsAttachedWorkerInfo = positions.map((p) => {
                const _workerInfo = workerInfo$.value[p.workerAddress.toLowerCase()]
                return { ...p, ..._workerInfo }
              },)
              positions$.next(positionsAttachedWorkerInfo)
            }),
            switchMap(() => getUserPositionSummary$(selectedAddress$.value)),
            tap((userSummary) => {
              userPositionSummary$.next(userSummary)
            }),
            takeUntil(this.destroy$)
          )
        })
      ),
      this.view$.pipe(
        tap(() => {
          // Reset positions array
          positions$.next([])
          // Reset page
          this.page$.next(1)
        })
      ),
      positions$,
      userPositionSummary$,
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })

    logout$.subscribe(() => {
      positions$.next([])
    })
  }
  
  componentWillUnMount() {
    this.destroy$.next(true)
  }
    
  render() {
    const view = this.view$.value

    const earned = Object.values(debtTokens).reduce((acc, cur) => {

      const pendingAmount = new BigNumber(pendingGT$.value[cur.pid])
        .div(10 ** (tokenList && tokenList["KLEVA"].decimals))
        .toNumber()

      return new BigNumber(acc).plus(pendingAmount).toNumber()
    }, new BigNumber(0))
    
    const totalItemCount = view === 'active' 
      ? userPositionSummary$.value && userPositionSummary$.value.livePositionCount
      : userPositionSummary$.value && userPositionSummary$.value.killedPositionCount

    const lastPage = Math.ceil(totalItemCount / ITEM_PER_PAGE)

    return !!selectedAddress$.value && (
      <div className="MyPositions">
        <div className="MyPositions__header">
          <div className="MyPositions__headerLeft">
            <p className="MyPositions__title">My Positions</p>
            <div className="MyPositions__positionToggle">
              <span
                onClick={() => {
                  if (this.view$.value === 'active') return
                  this.view$.next('active')
                }} 
                className={cx("MyPositions__positionItem", {
                  "MyPositions__positionItem--active": view === "active",
                })}
              >
                Active
              </span>
              <span
                onClick={() => {
                  if (this.view$.value === 'liquidated') return
                  this.view$.next('liquidated')
                }} 
                className={cx("MyPositions__positionItem", {
                  "MyPositions__positionItem--active": view === "liquidated",
                })}
              >
                Liquidated
              </span>
            </div>
          </div>
          <div className="MyPositions__headerRight">
            <div className="MyPositions__KlevaEarned">
              <div className="MyPositions__KlevaEarnedInfo">
                <span className="MyPositions__KlevaEarnedValue">{Number(earned).toLocaleString('en-us', { maximumFractionDigits: 2 })}</span>
                <span className="MyPositions__KlevaEarnedLabel">KLEVA Earned</span>
              </div>
              <button onClick={() => openModal$.next({ component: <EarnedPopup />})} className="MyPositions__KleaveEarnedEarnButton">
                Claim
              </button>
            </div>
          </div>
        </div>
        {positions$.value.length !== 0 && (
          <>
            <div className="MyPositions__content">
              <PositionList list={positions$.value} view={view} />
            </div>
            <Pagination
              currentPage={this.page$.value}
              lastPage={lastPage}
              nextAvailable={this.page$.value + 1 <= lastPage}
              prevAvailable={this.page$.value - 1 > 0}
              onNext={() => {
                this.page$.next(this.page$.value + 1)
              }}
              onPrev={() => {
                this.page$.next(this.page$.value - 1)
              }}
            />
          </>
        )}
      </div>
    )
  }
}

export default MyPositions