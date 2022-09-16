import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './SubMenu.scss'
import LanguageChange from './LanguageChange';
import { I18n } from './common/I18n';
import { closeModal$, openModal$ } from '../streams/ui'
import WKLAYSwitchModal from './modals/WKLAYSwitchModal'
import { selectedAddress$ } from '../streams/wallet'
import ConnectWalletPopup from './ConnectWalletPopup'
import Dashboard from './dashboard/Dashboard'
import Modal from './common/Modal'
import ThickHR from './common/ThickHR'
import { currentTab$ } from '../streams/view'

class SubMenu extends Component {

  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      of(true),
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
      <div className="SubMenu">
        <div 
          className="SubMenu__item SubMenu__item--dashboard"
          onClick={() => {
            closeModal$.next(true)
            currentTab$.next('dashboard')
          }}
        >
          {I18n.t('dashboard')}
        </div>
        <div 
          onClick={() => {

            if (!selectedAddress$.value) {
              openModal$.next({
                classNameAttach: "Modal--mobileCoverAll",
                component: <ConnectWalletPopup />
              })
              return
            }

            openModal$.next({
              component: <WKLAYSwitchModal />,
              classNameAttach: 'Modal--mobileCoverAll'
            })
          }}
          className="SubMenu__item SubMenu__item--switch"
        >{I18n.t('wklaySwitch')}</div>
        <div 
          onClick={() => {
            closeModal$.next(true)
            currentTab$.next('useguide')
          }}
          className="SubMenu__item SubMenu__item--useguide"
        >
          {I18n.t('useGuide')}
        </div>
        <div
          onClick={() => {
            closeModal$.next(true)
            currentTab$.next('glossary')
          }}
          className="SubMenu__item SubMenu__item--glossary"
        >
          {I18n.t('glossary')}
        </div>
        <div onClick={() => {
          closeModal$.next(true)
          currentTab$.next('withus')
        }} className="SubMenu__item SubMenu__item--withus">WITH US</div>
        <LanguageChange />
      </div>
    )
  }
}

export default SubMenu