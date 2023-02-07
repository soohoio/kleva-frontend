import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './LeverageInput.scss'
import { I18n } from './I18n'
import QuestionMark from './QuestionMark'
import LeverageInfoModal from '../modals/LeverageInfoModal'
import { openModal$ } from '../../streams/ui'
import { noRounding, replaceall } from '../../utils/misc'
import Boosted from '../Boosted'
import { getBufferedLeverage } from '../../utils/calc'

class LeverageInput extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    const { leverage$ } = this.props
    merge(
      leverage$,
    ).pipe(
      debounceTime(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })
    
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }
    
  render() {
    const { workerConfig, leverageCap, leverageLowerBound, offset, leverage$, setLeverage } = this.props

    const leverageValue = noRounding(leverage$.value, 2)

    const boostedLeverageCap = workerConfig
      && noRounding(getBufferedLeverage(workerConfig.membershipWorkFactorBps), 1)

    return (
      <div className="LeverageInput">
        <div className="LeverageInput__header">
          <div className="LeverageInput__headerLeft">
            {I18n.t('leverage')}
            <QuestionMark
              onClick={() => {
                openModal$.next({
                  component: <LeverageInfoModal />
                })
              }}
            />
          </div>
          {/* <div className="LeverageInput__headerRight">
            <Boosted
               workerConfig={workerConfig}
              description={`${I18n.t('boostedMaximumaAPR.2')} ${boostedLeverageCap}${I18n.t('farming.multiplyLabel')}`}
            />
          </div> */}
        </div>
        <div className="LeverageInput__content">
          
          <div className="LeverageInput__inputWrapper">
            <input
              inputmode="decimal"
              onChange={(e) => {
                // if (Number(e.target.value) > leverageCap) {
                //   leverage$.next(leverageCap)
                //   return
                // }
                // leverage$.next(e.target.value)

                let temp = e.target.value
                const pureNumberValue = Number(replaceall(',', '', temp))

                const splitted = String(e.target.value).split('.')
                const decimalPart = splitted[1]

                // invalid value: if decimal part length is greater than 2
                if (decimalPart && decimalPart.length > 2) return
                
                // if (pureNumberValue < 1) {
                //   leverage$.next(1)
                //   return
                // }

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
                if (leverage$.value == 0) {
                  e.target.value = e.target.value.replace('0', '')
                }

                // If value becomes '', change it to untouched value, which is 0
                // if (e.target.value === '') {
                  // e.target.value = 0
                // }

                // e.target.value.length will be decreased if user inputs backspace.
                // which means "remove"
                const isRemoving = leverage$.value.length > e.target.value.length

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

                // leverage$.value should be a number, not a decorated number string.
                // That's why we replace all ',' to ''
                const nextLeverage = replaceall(',', '', e.target.value)

                leverage$.next(nextLeverage)
              }}
              onBlur={() => {
                const leverage = leverage$.value
                if (leverageLowerBound && (leverage < leverageLowerBound)) {
                  leverage$.next(leverageLowerBound)
                  return
                }

                if (leverage < 1) {
                  leverage$.next(1)
                  return
                }

                if (leverage > leverageCap) {
                  leverage$.next(leverageCap)
                  return
                }
              }}
              className="LeverageInput__leverageInput"
              value={leverageValue}
            />
            <span className="LeverageInput__x">{I18n.t('farming.multiplyLabel')}</span>
          </div>

          <div className="LeverageInput__buttons">
            <button
              onClick={() => {
                const nextLeverage = Number(leverageValue) - offset
                if (leverageLowerBound && (nextLeverage < leverageLowerBound)) {
                  setLeverage(leverageLowerBound, leverageCap, leverageLowerBound)
                  return
                }

                if (nextLeverage < 1) {
                  setLeverage(1, leverageCap, leverageLowerBound)
                  return
                }

                if (nextLeverage > leverageCap) {
                  setLeverage(leverageCap, leverageCap, leverageLowerBound)
                  return
                }

                setLeverage(nextLeverage, leverageCap, leverageLowerBound)
              }}
              className="LeverageInput__minus"
            >
              <img src="/static/images/minus.svg?date=20220929" />
            </button>
            <button
              onClick={() => {
                const nextLeverage = Number(leverageValue) + offset
                if (leverageLowerBound && (nextLeverage < leverageLowerBound)) {
                  setLeverage(leverageLowerBound, leverageCap, leverageLowerBound)
                  return
                }

                if (nextLeverage < 1) {
                  setLeverage(1, leverageCap, leverageLowerBound)
                  return
                }

                if (nextLeverage > leverageCap) {
                  setLeverage(leverageCap, leverageCap, leverageLowerBound)
                  return
                }
                setLeverage(nextLeverage, leverageCap, leverageLowerBound)
              }}
              className="LeverageInput__plus"
            >
              <img src="/static/images/plus.svg?date=20220929" />
            </button>
          </div>
        </div>
      </div>
    )
  }
}

export default LeverageInput