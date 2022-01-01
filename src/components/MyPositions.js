import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of, interval, BehaviorSubject } from 'rxjs'
import { filter, switchMap, distinctUntilChanged, takeUntil, tap, startWith } from 'rxjs/operators'

import PositionList from 'components/PositionList'
import FarmList from './FarmList'

import './MyPositions.scss'
import { logout$, selectedAddress$ } from '../streams/wallet'
import { getPositions$ } from '../streams/graphql'
import { getPositionInfo$ } from '../streams/contract'
import { aprInfo$, workerInfo$, positions$ } from '../streams/farming'

class MyPositions extends Component {
  destroy$ = new Subject()
  
  state = {
    // "active", "liquidated"
    view: "active",
  }

  componentDidMount() {
    merge(
      selectedAddress$.pipe(
        filter((a) => !!a),
        switchMap(() => {
          return interval(5000).pipe(
            startWith(0),
            switchMap(() => getPositions$(selectedAddress$.value)),
            switchMap((positions) => getPositionInfo$(positions)),
            tap((positions) => {
              const positionsAttachedWorkerInfo = positions.map((p) => {
                const _workerInfo = workerInfo$.value[p.workerAddress.toLowerCase()]
                console.log(_workerInfo, "@_workerInfo")
                return { ...p, ..._workerInfo }
              },)
              positions$.next(positionsAttachedWorkerInfo)
            }),
            takeUntil(this.destroy$)
          )
        })
      ),
      positions$,
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
      </div>
    )
  }
}

export default MyPositions