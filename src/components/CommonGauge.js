import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, fromEvent, of } from 'rxjs'
import { debounceTime, switchMap, takeUntil, tap } from 'rxjs/operators'

import { range } from 'lodash'

import './CommonGauge.scss'

class CommonGauge extends Component {
  $gaugeBar = createRef()

  destroy$ = new Subject()

  componentDidMount() {
    const { percentage$ } = this.props

    // console.log(this.props, 'this.props')
    // console.log(percentage$, 'percentage$')

    merge(
      percentage$,
    ).pipe(
      debounceTime(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {

      console.log(percentage$.value, 'percentage$.value')

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
    const { 
      min,
      max,
      percentage$, 
      limit,
      disabled,
    } = this.props

    if (disabled) return

    const clientX = e.clientX || (e.changedTouches && e.changedTouches[0] && e.changedTouches[0].clientX)
    const rect = document.querySelector('.GaugeBar__barBehind').getBoundingClientRect()
    const percent = Math.max(0, Math.min((clientX - rect.x) / rect.width, 1))

    const nextPercentage = percent * 100

    
    if (nextPercentage > max) {
      percentage$.next(max)
      return
    }

    if (nextPercentage < min) {
      percentage$.next(min)
      return
    }

    percentage$.next(nextPercentage)
  }

  render() {
    const {
      min,
      max,
      title,
      description,
      percentage$,
      offset,
      limit,
      
      bottomContent,
    } = this.props

    const barItemCount = parseInt(100 / offset) + 1

    const indexLike = (percentage$.value) / offset
    // const barWidth = ((indexLike / (barItemCount - 1)) * 100) - min
    const barWidth = Math.max(percentage$.value - min, 1)

    const barHeadLeftMargin = 0
    
    const barHeadLeft = percentage$.value < 3
      ? 0
      : `calc(${percentage$.value}% - 12px)`

    const availableRangeBarWidth = max - min
    const availableRangeBarLeft = min

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
          <div style={{ left: `${availableRangeBarLeft}%`, width: `${barWidth}%` }} className="GaugeBar__bar" />
          <div style={{ left: `${availableRangeBarLeft}%`, width: `${availableRangeBarWidth}%` }} className="GaugeBar__availableRangeBar" />
          <div
            className="GaugeBar__barBehind"
          />
        </div>
        {bottomContent}
      </div>
    )
  }
}

export default CommonGauge