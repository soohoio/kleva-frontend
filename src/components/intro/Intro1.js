import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of, fromEvent, BehaviorSubject } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import { I18n } from '../common/I18n'

import './Intro1.scss'
import { selectedAddress$ } from '../../streams/wallet'
import { currentTab$ } from '../../streams/view'
import { openModal$ } from '../../streams/ui'
import ConnectWalletPopup from '../ConnectWalletPopup'

class Intro1 extends Component {

  destroy$ = new Subject()
  hideAnimation$ = new BehaviorSubject()

  $startButton = createRef()

  
  componentDidMount() {
    merge(
      selectedAddress$,
      this.hideAnimation$,
    ).pipe(
      debounceTime(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })
    

    const $app = document.querySelector("html")

    fromEvent(window, 'scroll').pipe(
      tap(() => {
        const shouldHideAnimation = $app.scrollTop > $app.scrollHeight - $app.offsetHeight - 156
        this.hideAnimation$.next(shouldHideAnimation)
      }),
      takeUntil(this.destroy$)
    ).subscribe()
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }
    
  render() {
    const { shouldShow } = this.props

    return (
      <div className="Intro1">
        <div className="Intro1__left">
          <p className="Intro1__title">
            {I18n.t('intro1.title')}
          </p>
          <p className="Intro1__description">
            {I18n.t('intro1.description')}
          </p>
          <button
            ref={this.$startButton}
            onClick={() => {
              currentTab$.next('lendnstake')
            }}
            className={cx("Intro1__start", {
              "Intro1__start--shouldShow": shouldShow,
              "Intro1__start--hideAnimation": this.hideAnimation$.value
            })}
          >
            {I18n.t('intro1.start')}
          </button>
        </div>
        <div className="Intro1__right">
          <img src="/static/images/intro/img_intro_1.png?date=20220929" />
        </div>
      </div>
    )
  }
}

export default Intro1