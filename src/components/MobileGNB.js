import React, { Component, Fragment, createRef } from 'react'
import { browserHistory } from 'react-router'
import cx from 'classnames'
import { BehaviorSubject, Subject, merge } from 'rxjs'
import { debounceTime, takeUntil, tap } from 'rxjs/operators'

import { path$ } from 'streams/location'
import { closeModal$ } from 'streams/ui'

import './MobileGNB.scss'
import { classNameAttach$, modalAnimation$, openModal$ } from '../streams/ui'

import Guide from 'components/common/Guide'
import ConnectWalletPopup from './ConnectWalletPopup'
import { logout$, selectedAddress$, walletProviderName$ } from '../streams/wallet'
import { I18n } from './common/I18n'
import SubMenu from './SubMenu'

class MobileGNB extends Component {
  destroy$ = new Subject()

  animation$ = new BehaviorSubject(false)

  componentDidMount() {
    merge(
      path$,
      walletProviderName$,
      modalAnimation$,
      this.animation$,
    ).pipe(
      debounceTime(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })

    setTimeout(() => {
      this.animation$.next(true)
    }, 10)
  }

  componentWillUnmount() {
    this.destroy$.next(true)
  }

  render() {
    return (
      <div className={cx("MobileGNB", {
        [`MobileGNB--animation-${modalAnimation$.value}`]: this.animation$.value && true,
      })}>
        <div className="MobileGNB__header">
          <img 
            onClick={() => {
              closeModal$.next(true)
            }} 
            className="MobileGNB__close" 
            src="/static/images/exported/x.svg" 
          />
        </div>
        {selectedAddress$.value 
          ? (
            <>
              <p className="MobileGNB__connected">{I18n.t('connected', { title: walletProviderName$.value })}</p>
              <p 
                className="MobileGNB__logout"
                onClick={() => logout$.next(true)}
              >
                {I18n.t('logout')}
              </p>
            </>
            )
          : (
            <Guide
              title={I18n.t('connectWallet2')}
              buttonTitle={I18n.t('connect')}
              onClick={() => {
                openModal$.next({
                  classNameAttach: "Modal--mobileCoverAll",
                  component: <ConnectWalletPopup />
                })
              }}
            />
          )
        }

        <SubMenu />
      </div>
    )
  }
}

export default MobileGNB