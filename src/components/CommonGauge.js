import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, fromEvent, of } from 'rxjs'
import { switchMap, takeUntil, tap } from 'rxjs/operators'

import { range } from 'lodash'

import './CommonGauge.scss'

class CommonGauge extends Component {
  $gaugeBar = createRef()

  destroy$ = new Subject()

  componentDidMount() {
    const { percentage$ } = this.props
    merge(
      percentage$,
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })

    const mouseUp$ = fromEvent(window, 'mouseup')

    merge(
      fromEvent(this.$gaugeBar.current, 'mousedown'),
      fromEvent(this.$gaugeBar.current, 'touchstart'),
    ).pipe(
      switchMap((e) => {
        if (e.target.className === "GaugeBar__barItemLabel") {

          return of(false)
        }

        this.setPercentage(e)

        return merge(
          fromEvent(window, 'mousemove'),
          fromEvent(window, 'touchmove'),
        ).pipe(
          tap((e) => {
            this.setPercentage(e)
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

  setPercentage = (e) => {
    const { percentage$, limit } = this.props

    const clientX = e.clientX || (e.changedTouches[0] && e.changedTouches[0].clientX)
    const rect = document.querySelector('.GaugeBar__barBehind').getBoundingClientRect()
    const percent = Math.max(0, Math.min((clientX - rect.x) / rect.width, 1))

    const nextPercentage = percent * 100

    if (nextPercentage > limit) {
      return
    }

    percentage$.next(nextPercentage)
  }

  render() {
    const {
      title ,
      description,
      percentage$,
      offset,
      limit,
    } = this.props

    const barItemCount = parseInt(100 / offset) + 1

    const indexLike = (percentage$.value) / offset
    const barWidth = (indexLike / (barItemCount - 1)) * 100

    const barHeadLeftMargin = 2
    const barHeadLeft = `calc(${barWidth}% - ${barHeadLeftMargin}px)`

    return (
      <div className="CommonGauge">
        <div className="CommonGauge__header">
          <div className="CommonGauge__titleWrapper">
            <span className="CommonGauge__title">{title}</span>
            {!!description && <p className="CommonGauge__description">{description}</p>}
          </div>
          <div className="CommonGauge__inputWrapper">
            <input
              className="CommonGauge__leverageInput"
              readOnly
              value={percentage$.value}
            />
            <span className="CommonGauge__x">%</span>
          </div>
        </div>
        <div
          ref={this.$gaugeBar}
          className="GaugeBar"
        >
          <div style={{ left: barHeadLeft }} className="GaugeBar__barHead" />
          <div style={{ width: `${barWidth}%` }} className="GaugeBar__bar" />
          {range(barItemCount).map((idx) => {
            const barValue = (offset * idx)

            return (
              <div
                key={idx}
                style={{ left: `${(idx / (barItemCount - 1)) * 100}%` }}
                className={cx("GaugeBar__barItem", {
                  [`GaugeBar__barItem--active`]: barValue <= percentage$.value,
                })}
              >
                <p 
                  onClick={() => {
                    const nextPercentage = barValue
                    if (nextPercentage > limit) {
                      return
                    }
                    percentage$.next(barValue)
                  }} 
                  className="GaugeBar__barItemLabel"
                >
                  {barValue}%
                </p>
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

export default CommonGauge