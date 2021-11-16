import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { distinctUntilChanged, takeUntil, tap } from 'rxjs/operators'

import PositionList from 'components/PositionList'

import './MyPositions.scss'

class MyPositions extends Component {
  destroy$ = new Subject()
  
  state = {
    // "active", "liquidated"
    view: "active",
  }

  componentDidMount() {
    
  }
  
  componentWillUnMount() {
    this.destroy$.next(true)
  }
    
  render() {
    const { view } = this.state

    const earned = 3384471.89
    
    return (
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
              <span
                onClick={() => this.setState({ view: 'liquidated' })} 
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
              <button className="MyPositions__KleaveEarnedEarnButton">
                Claim
              </button>
            </div>
          </div>
        </div>
        <div className="MyPositions__content">
          <PositionList />
        </div>
      </div>
    )
  }
}

export default MyPositions