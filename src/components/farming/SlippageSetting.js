import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './SlippageSetting.scss'
import QuestionMark from '../common/QuestionMark'
import { I18n } from '../common/I18n'
import { openModal$ } from '../../streams/ui'
import SlippageInfoModal from '../modals/SlippageInfoModal'
import { slippage$ } from '../../streams/setting'

class SlippageSetting extends Component {

  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      slippage$,
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
    return (
      <div className="SlippageSetting">
        <QuestionMark 
          title={I18n.t('slippageSetting')}
          onClick={() => {
            openModal$.next({
              component: <SlippageInfoModal />
            })
          }}
        />
        <div className="SlippageSetting__controller">
          <div className="SlippageSetting__inputWrapper">
            <input
              onChange={(e) => {
                slippage$.next(e.target.value)
              }}
              value={slippage$.value}
              className="SlippageSetting__input" 
            />
            <span className="SlippageSetting__percent">%</span>
          </div>
          <div 
            className={cx("SlippageSetting__button", {
              "SlippageSetting__button--active": slippage$.value == 0.3
            })}
            onClick={() => slippage$.next(0.3)}
          >
            0.3%
          </div>
          <div 
            className={cx("SlippageSetting__button", {
              "SlippageSetting__button--active": slippage$.value == 0.5
            })}
            onClick={() => slippage$.next(0.5)}
          >
            0.5%
          </div>
          <div 
            className={cx("SlippageSetting__button", {
              "SlippageSetting__button--active": slippage$.value == 1
            })}
            onClick={() => slippage$.next(1)}
          >
            1%
          </div>
        </div>
        <p className="SlippageSetting__description">{I18n.t('slippageSetting.description')}</p>
      </div>
    )
  }
}

export default SlippageSetting