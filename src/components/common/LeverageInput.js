import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './LeverageInput.scss'
import { I18n } from './I18n'
import QuestionMark from './QuestionMark'
import LeverageInfoModal from '../modals/LeverageInfoModal'
import { openModal$ } from '../../streams/ui'
import { noRounding } from '../../utils/misc'

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
    const { leverageCap, leverageLowerBound, offset, leverage$, setLeverage } = this.props

    const leverageValue = noRounding(leverage$.value, 2)

    return (
      <div className="LeverageInput">
        <div className="LeverageInput__header">
          {I18n.t('leverage')}
          <QuestionMark
            onClick={() => {
              openModal$.next({
                component: <LeverageInfoModal />
              })
            }}
          />
        </div>
        <div className="LeverageInput__content">
          
          <div className="LeverageInput__inputWrapper">
            <input
              onChange={(e) => {
                if (Number(e.target.value) > leverageCap) {
                  leverage$.next(leverageCap)
                  return
                }
                leverage$.next(e.target.value)
              }}
              className="LeverageInput__leverageInput"
              readOnly
              value={leverageValue}
            />
            <span className="LeverageInput__x">{I18n.t('farming.multiplyLabel')}</span>
          </div>

          <div className="LeverageInput__buttons">
            <button
              onClick={() => setLeverage(Number(leverageValue) - offset, leverageCap, leverageLowerBound)}
              className="LeverageInput__minus"
            >
              <img src="/static/images/minus.svg" />
            </button>
            <button
              onClick={() => setLeverage(Number(leverageValue) + offset, leverageCap, leverageLowerBound)}
              className="LeverageInput__plus"
            >
              <img src="/static/images/plus.svg" />
            </button>
          </div>
        </div>
      </div>
    )
  }
}

export default LeverageInput