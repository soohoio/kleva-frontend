import React, { Component, Fragment, createRef } from 'react'
import { browserHistory } from 'react-router'
import cx from 'classnames'
import { BehaviorSubject, Subject, merge, timer } from 'rxjs'
import { debounceTime, switchMap, takeUntil, filter, tap } from 'rxjs/operators'

import { path$ } from 'streams/location'
import { closeModal$ } from 'streams/ui'

import './MobileGNB.scss'
import { classNameAttach$, modalAnimation$, openModal$ } from '../streams/ui'

import Guide from 'components/common/Guide'
import ConnectWalletPopup from './ConnectWalletPopup'
import { knsDomain$, logout$, selectedAddress$, walletProviderName$ } from '../streams/wallet'
import { I18n } from './common/I18n'
import SubMenu from './SubMenu'
import copy from 'copy-to-clipboard'
import { compactKnsDomain } from '../utils/misc'

class MobileGNB extends Component {
  destroy$ = new Subject()

  animation$ = new BehaviorSubject(false)

  copied$ = new BehaviorSubject()

  componentDidMount() {
    merge(
      path$,
      walletProviderName$,
      modalAnimation$,
      this.animation$,
      selectedAddress$,
      knsDomain$,
      this.copied$,
    ).pipe(
      debounceTime(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })

    setTimeout(() => {
      this.animation$.next(true)
    }, 10)

    this.copied$.pipe(
      filter((copied) => !!copied), // only when copied true
      switchMap(() => {
        return timer(1.5 * 1000) // 1.5s
      }),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.copied$.next(false)
    })
  }

  componentWillUnmount() {
    this.destroy$.next(true)
  }

  copy = (copyTarget) => {
    this.copied$.next(true)
    copy(copyTarget)
  }

  render() {

    const addressDisplay = (knsDomain$.value && compactKnsDomain(knsDomain$.value, 11)) || (selectedAddress$.value?.slice(0, 4) + "..." + selectedAddress$.value?.slice(-4))
    const copyTarget = knsDomain$.value || selectedAddress$.value

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
            src="/static/images/exported/x.svg?date=20220929" 
          />
        </div>
        {selectedAddress$.value 
          ? (
            <>
              {/* <p className="MobileGNB__connected">{I18n.t('connected', { title: walletProviderName$.value })}</p> */}
              {walletProviderName$.value && (
                <img 
                  className={cx("MobileGNB__walletProviderIcon", {
                    [`MobileGNB__walletProviderIcon--${walletProviderName$.value}`]: true,
                  })}
                  src={`/static/images/common/icon_wallet_${walletProviderName$.value?.toLowerCase()}.svg`} 
                />
              )}
              <div 
                onClick={() => {
                  this.copy(copyTarget)
                }} 
                className="MobileGNB__walletAddress"
              >
                <span>{addressDisplay}</span>
                {this.copied$.value 
                  ? (
                    <div className="MobileGNB__copyIcon MobileGNB__copyIcon--copied">
                      <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M15.277 1.95773C15.8526 2.38684 15.9714 3.20134 15.5423 3.77696L7.34228 14.777C7.11388 15.0834 6.76224 15.2737 6.38083 15.2975C5.99941 15.3212 5.62686 15.176 5.36221 14.9003L0.56221 9.90029C0.0649932 9.38236 0.081788 8.55941 0.599722 8.0622C1.11766 7.56498 1.9406 7.58177 2.43782 8.09971L6.17498 11.9926L13.4577 2.22304C13.8869 1.64741 14.7013 1.52862 15.277 1.95773Z" fill="#2D65FC" />
                      </svg>
                    </div>
                  )
                  : (

                    <div className="MobileGNB__copyIcon">
                      <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g clip-path="url(#clip0_5801_18290)">
                          <path fill-rule="evenodd" clip-rule="evenodd" d="M3.5 1.4H12.91C12.7822 0.993664 12.528 0.638739 12.1845 0.386922C11.8409 0.135104 11.426 -0.000450653 11 1.12561e-06H3.5C2.57174 1.12561e-06 1.6815 0.36875 1.02513 1.02513C0.36875 1.6815 1.12561e-06 2.57174 1.12561e-06 3.5V11C-0.000450653 11.426 0.135104 11.8409 0.386922 12.1845C0.638739 12.528 0.993664 12.7822 1.4 12.91V3.5C1.4 2.94305 1.62125 2.4089 2.01508 2.01508C2.4089 1.62125 2.94305 1.4 3.5 1.4Z" fill="#B8BDCC" />
                          <path fill-rule="evenodd" clip-rule="evenodd" d="M13.5 4.4H5.5C5.20826 4.4 4.92847 4.51589 4.72218 4.72218C4.51589 4.92847 4.4 5.20826 4.4 5.5V13.5C4.4 13.7917 4.51589 14.0715 4.72218 14.2778C4.92847 14.4841 5.20826 14.6 5.5 14.6H13.5C13.7917 14.6 14.0715 14.4841 14.2778 14.2778C14.4841 14.0715 14.6 13.7917 14.6 13.5V5.5C14.6 5.20826 14.4841 4.92847 14.2778 4.72218C14.0715 4.51589 13.7917 4.4 13.5 4.4ZM5.5 3C4.83696 3 4.20107 3.26339 3.73223 3.73223C3.26339 4.20107 3 4.83696 3 5.5V13.5C3 14.163 3.26339 14.7989 3.73223 15.2678C4.20107 15.7366 4.83696 16 5.5 16H13.5C14.163 16 14.7989 15.7366 15.2678 15.2678C15.7366 14.7989 16 14.163 16 13.5V5.5C16 4.83696 15.7366 4.20107 15.2678 3.73223C14.7989 3.26339 14.163 3 13.5 3H5.5Z" fill="#B8BDCC" />
                        </g>
                        <defs>
                          <clipPath id="clip0_5801_18290">
                            <rect width="17" height="16" fill="white" />
                          </clipPath>
                        </defs>
                      </svg>
                    </div>
                  )
                }
              </div>
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