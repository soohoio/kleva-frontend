import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of, interval, BehaviorSubject } from 'rxjs'
import { filter, switchMap, distinctUntilChanged, takeUntil, tap, startWith } from 'rxjs/operators'

import PositionList from 'components/PositionList'
import FarmList from './FarmList'

import './MyPositions.scss'
import { logout$, selectedAddress$ } from '../streams/wallet'
import { getPositions$, getUserPositionSummary$, ITEM_PER_PAGE } from '../streams/graphql'
import { getPositionInfo$ } from '../streams/contract'
import { aprInfo$, workerInfo$, positions$, viewingPositionLatestBlockTime$, userPositionSummary$ } from '../streams/farming'
import Pagination from './Pagination'

class MyPositions extends Component {
  destroy$ = new Subject()

  page$ = new BehaviorSubject(1)
  
  state = {
    // "active", "liquidated"
    view: "active",
  }

  componentDidMount() {
    merge(
      selectedAddress$.pipe(
        filter((a) => !!a),
        switchMap(() => {
          return merge(
            this.page$,
            interval(5000)
          ).pipe(
            startWith(0),
            switchMap(() => getPositions$(selectedAddress$.value, this.page$.value)),
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
    const { view } = this.state

    const earned = 3384471.89
    
    const totalItemCount = view === 'active' 
      ? userPositionSummary$.value && userPositionSummary$.value.livePositionCount
      : userPositionSummary$.value && userPositionSummary$.value.killedPositionCount

    const lastPage = Math.ceil(totalItemCount / ITEM_PER_PAGE)

    return positions$.value.length !== 0 && (
      <div className="MyPositions">
        <div className="MyPositions__header">
          <div className="MyPositions__headerLeft">
            <p className="MyPositions__title">My Positions</p>
            <div className="MyPositions__positionToggle">
              <span
                onClick={() => this.setState({ view: 'active' })} 
                className={cx("MyPositions__positionItem", {
                  "MyPositions__positionItem--active": view === "active",
                })}
              >
                Active
              </span>
              {/* <span
                onClick={() => this.setState({ view: 'liquidated' })} 
                className={cx("MyPositions__positionItem", {
                  "MyPositions__positionItem--active": view === "liquidated",
                })}
              >
                Liquidated
              </span> */}
            </div>
          </div>
          <div className="MyPositions__headerRight">
            <div className="MyPositions__KlevaEarned">
              <div className="MyPositions__KlevaEarnedInfo">
                <span className="MyPositions__KlevaEarnedValue">{Number(earned).toLocaleString('en-us', { maximumFractionDigits: 2 })}</span>
                <span className="MyPositions__KlevaEarnedLabel">KLEVA Earned</span>
              </div>
              <button className="MyPositions__KleaveEarnedEarnButton">
                Claim
              </button>
            </div>
          </div>
        </div>
        <div className="MyPositions__content">
          <PositionList 
            list={positions$.value} 
          />
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
      </div>
    )
  }
}

export default MyPositions