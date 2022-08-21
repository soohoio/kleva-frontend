import React, { Component, Fragment, createRef } from 'react'
import { browserHistory } from 'react-router'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { debounceTime, takeUntil, tap } from 'rxjs/operators'

import { path$ } from 'streams/location'
import { closeModal$ } from 'streams/ui'

import './MobileGNB.scss'
import { openModal$ } from '../streams/ui'

import Guide from 'components/common/Guide'
import ConnectWalletPopup from './ConnectWalletPopup'
import { logout$, selectedAddress$, walletProviderName$ } from '../streams/wallet'
import { I18n } from './common/I18n'
import SubMenu from './SubMenu'

class MobileGNB extends Component {
  destroy$ = new Subject()

  componentDidMount() {
    merge(
      path$,
      walletProviderName$,
    ).pipe(
      debounceTime(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })
  }

  componentWillUnmount() {
    this.destroy$.next(true)
 45 }

  render() {
    return (
      <div className="MobileGNB">
        <div className="MobileGNB__header">
          <img 
            onClick={() => closeModal$.next(true)} 
            className="MobileGNB__close" 
            src="/static/images/close-black.svg" 
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
              buttonTitle={I18n.t('guide.connectWallet.buttonTitle')}
              onClick={() => {
                openModal$.next({
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