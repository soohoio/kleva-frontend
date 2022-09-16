import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, fromEvent, of, BehaviorSubject } from 'rxjs'
import { debounceTime, switchMap, takeUntil, tap } from 'rxjs/operators'

import { range } from 'lodash'

import './CommonGauge.scss'
import { noRounding, replaceall } from '../utils/misc'

class CommonGauge extends Component {
  $gaugeBar = createRef()

  destroy$ = new Subject()

  prevValidPercentage$ = new BehaviorSubject()

  componentDidMount() {
    const { percentage$ } = this.props

    merge(
      percentage$,
      this.prevValidPercentage$,
    ).pipe(
      debounceTime(1),
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
          fromEvent(this.$gaugeBar.current, 'mousemove'),
          fromEvent(this.$gaugeBar.current, 'touchmove'),
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
      this.prevValidPercentage$.next(max)
      percentage$.next(max)
      return
    }

    if (nextPercentage < min) {
      this.prevValidPercentage$.next(min)
      percentage$.next(min)
      return
    }
    
    this.prevValidPercentage$.next(nextPercentage)
    percentage$.next(nextPercentage)
  }

  isValidPercentage = (percentage) => {
    const { min, max } = this.props
    if (Number(min) > percentage) return false
    if (Number(max) < percentage) return false
    if (isNaN(percentage)) return false

    return true
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
      : percentage$.value > 100
        ? `calc(100% - 12px)`
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
              onChange={(e) => {

                let temp = e.target.value
                const pureNumberValue = Number(replaceall(',', '', temp))

                const splitted = String(e.target.value).split('.')
                const decimalPart = splitted[1]

                // invalid value: if decimal part length is greater than 2
                if (decimalPart && decimalPart.length > 2) return

                // invalid value: if isNaN
                if (isNaN(pureNumberValue)) {
                  return
                }

                // invalid value: if value is geq 10_000_000_000_000_000
                if (e.target.value >= 10_000_000_000_000_000) return
                // invalid value: if value is ge 100
                if (e.target.value > 100) return
                
                // The fact that percentage is 0 means it is untouched value,
                // So if user inputs number on it, '0' should be removed.
                // To prevent these cases: 
                // 0 -> 10 (by typing 1 before '0')
                // 0 -> 01 (by typing 1 behind '0')
                if (percentage$.value == 0) {
                  e.target.value = e.target.value.replace('0', '')
                }

                // If value becomes '', change it to untouched value, which is 0
                if (e.target.value === '') {
                  e.target.value = 0
                }

                // e.target.value.length will be decreased if user inputs backspace.
                // which means "remove"
                const isRemoving = percentage$.value.length > e.target.value.length

                // While removing, if there's a trailing comma or trailling dot means,
                // user want to decrease number value
                // In this case, program should remove '.' so user doesn't need to remove '.' by himself.
                // (X) 123.45 -> 123.4 -> 123.
                //       (backspace) (backspace)
                // (O) 123.45 -> 123.4 -> 123
                //       (backspace) (backspace)
                const hasTrailingDotAfterRemove = isRemoving && (e.target.value.slice(-1) === "." || e.target.value.slice(-1) === ",")

                if (hasTrailingDotAfterRemove) {
                  e.target.value = e.target.value.slice(0, e.target.value.length - 1)
                }

                // percentage$.value should be a number, not a decorated number string.
                // That's why we replace all ',' to ''
                const nextPercentage = replaceall(',', '', e.target.value)

                percentage$.next(nextPercentage)
              }}
              onBlur={() => {

                if (this.isValidPercentage(percentage$.value)) {
                  // save previous valid value
                  this.prevValidPercentage$.next(percentage$.value)
                } else {
                  // If percentage is invalid, overwrite it with previous valid value
                  percentage$.next(this.prevValidPercentage$.value || 0)
                }
              }}
              value={noRounding(percentage$.value, 2)}
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