import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import { I18n } from '../common/I18n'

import './Intro1.scss'
import { selectedAddress$ } from '../../streams/wallet'
import { currentTab$ } from '../../streams/view'
import { openModal$ } from '../../streams/ui'
import ConnectWalletPopup from '../ConnectWalletPopup'

class Intro1 extends Component {

  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      selectedAddress$,
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
            onClick={() => {

              if (selectedAddress$.value) {
                currentTab$.next('myasset')
                return
              }

              openModal$.next({
                component: <ConnectWalletPopup />
              })
            }}
            className={cx("Intro1__start", {
              "Intro1__start--shouldShow": shouldShow,
            })}
          >
            {I18n.t('intro1.start')}
          </button>
        </div>
        <div className="Intro1__right">
          <img src="/static/images/intro/img_intro_1.png" />
        </div>
      </div>
    )
  }
}

export default Intro1