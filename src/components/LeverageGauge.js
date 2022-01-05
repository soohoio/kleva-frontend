import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, fromEvent, of } from 'rxjs'
import { switchMap, takeUntil, tap } from 'rxjs/operators'

import { range } from 'lodash'

import './LeverageGauge.scss'

const BAR_OFFSET = 0.5

class LeverageGauge extends Component {
  $gaugeBar = createRef()

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

    const mouseUp$ = fromEvent(window, 'mouseup').pipe(
      tap(() => {
        console.log("global mouse up!")
      })
    )

    merge(
      fromEvent(this.$gaugeBar.current, 'mousedown'),
      fromEvent(this.$gaugeBar.current, 'touchstart'),
    ).pipe(
      switchMap((e) => {
        if (e.target.className === "GaugeBar__barItemLabel") {

          return of(false)
        }

        this.setLeverage(e)

        return merge(
          fromEvent(window, 'mousemove'),
          fromEvent(window, 'touchmove'),
        ).pipe(
          tap((e) => {
            this.setLeverage(e)
          }),
          takeUntil(mouseUp$)
        )
      }),
      takeUntil(this.destroy$)
    ).subscribe()
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }

  setLeverage = (e) => {
    const { leverageMin, leverageCap, leverage$ } = this.props

    const clientX = e.clientX || (e.changedTouches[0] && e.changedTouches[0].clientX)
    const rect = document.querySelector('.GaugeBar__barBehind').getBoundingClientRect()
    const percent = Math.max(0, Math.min((clientX - rect.x) / rect.width, 1))

    const nextLeverageValue = 1 + (percent * (leverageCap - 1))

    if (leverageMin && nextLeverageValue < leverageMin) {
      return
    }

    leverage$.next(1 + (percent * (leverageCap - 1)))
  }
    
  render() {
    const { 
      title = "Leverage", 
      description, 
      leverage$, 
      leverageCap,
    } = this.props

    const leverage = leverage$.value
    const barItemCount = parseInt(leverageCap / BAR_OFFSET) - 1

    const indexLike = (leverage - 1) / BAR_OFFSET
    const barWidth = (indexLike / (barItemCount - 1)) * 100


    // const barHeadLeftMargin = (leverage === 1 || leverage == leverageCap) ? 0 : 2
    const barHeadLeftMargin = 2
    const barHeadLeft = `calc(${barWidth}% - ${barHeadLeftMargin}px)`
    
    return (
      <div className="LeverageGauge">
        <div className="LeverageGauge__header">
          <div className="LeverageGauge__titleWrapper">
            <span className="LeverageGauge__title">{title}</span>
            {!!description && <p className="LeverageGauge__description">{description}</p>}
          </div>
          <div className="LeverageGauge__inputWrapper">
            <input 
              className="LeverageGauge__leverageInput" 
              readOnly
              value={leverage$.value}
            />
            <span className="LeverageGauge__x">X</span>
          </div>
        </div>
        <div
          ref={this.$gaugeBar}
          className="GaugeBar"
        >
          <div style={{ left: barHeadLeft }} className="GaugeBar__barHead" />
          <div style={{ width: `${barWidth}%` }} className="GaugeBar__bar" />
          {range(barItemCount).map((idx) => {
            const barValue = (BAR_OFFSET * idx) + 1

            return (
              <div
                key={idx}
                style={{ left: `${(idx / (barItemCount - 1)) * 100}%` }}
                className={cx("GaugeBar__barItem", {
                  [`GaugeBar__barItem--active`]: barValue <= leverage,
                })}
              >
                <p onClick={() => leverage$.next(barValue)} className="GaugeBar__barItemLabel">{barValue}x</p>
              </div>
            )
          })}
          <div
            className="GaugeBar__barBehind"
          />
        </div>

      </div>
    )
  }
}

export default LeverageGauge