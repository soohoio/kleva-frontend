import React, { Component, Fragment, createRef } from 'react'
import { browserHistory } from 'react-router'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import ConnectWallet from 'components/ConnectWallet'
import ConnectWalletMobile from 'components/ConnectWalletMobile'
import Hamburger from 'components/Hamburger'
import HeaderInfo from './HeaderInfo'
import HeaderInfoMobile from './HeaderInfoMobile'

import { isDesktop$ } from '../streams/ui'

import './Header.scss'

class Header extends Component {
  destroy$ = new Subject()

  componentDidMount() {
    merge(
      isDesktop$
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })
  }

  componentWillUnMount() {
    this.destroy$.next(true)
  }

  render() {

    return (
      <>
        <div className="Header">
          <div 
            onClick={() => {
              browserHistory.push('/')
            }} 
            className="Header__left"
          >
            <img 
              className="Header__logo" 
              src={isDesktop$.value 
                ? "/static/images/icons-gnb-logo@3x.png"
                : "/static/images/icons-gnb-logo-white@3x.png"
              }
            />
          </div>
          <div className="Header__right">
            <HeaderInfo />
            <ConnectWallet />
          </div>
          <div className="Header__mobileRight">
            <ConnectWalletMobile />
            <Hamburger />
          </div>
        </div>
        <div className="Header__mobileOnly">
          <HeaderInfoMobile />
          {/* <ConnectWalletMobile /> */}
        </div>
      </>
    )
  }
}

export default Header