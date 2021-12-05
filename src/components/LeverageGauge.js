import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import './LeverageGauge.scss'

const GaugeBar = () => {
  return (
    <div className="GaugeBar">
      <div className="GaugeBar__bar" />
      <div className="GaugeBar__barBehind" />
    </div>
  )
}

class LeverageGauge extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    const { leverage$ } = this.props
    merge(
      leverage$,
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })
  }
  
  componentWillUnMount() {
    this.destroy$.next(true)
  }

  // handleLeverageChange = (e) => {
  //   const { leverage$, leverageCap } = this.props
    
  //   if (Number(e.target.value) < 1) {
  //     leverage$.next(1)
  //     return
  //   }

  //   if (Number(e.target.value) > leverageCap) {
  //     leverage$.next(leverageCap)
  //     return
  //   }

  //   leverage$.next(e.target.value)
  // }
    
  render() {
    const { leverage$ } = this.props
    
    return (
      <div className="LeverageGauge">
        <div className="LeverageGauge__header">
          <span className="LeverageGauge__title">Leverage</span>
          <div className="LeverageGauge__inputWrapper">
            <input 
              className="LeverageGauge__leverageInput" 
              readOnly
              value={leverage$.value}
            />
            <span className="LeverageGauge__x">X</span>
          </div>
        </div>
        <GaugeBar />
      </div>
    )
  }
}

export default LeverageGauge