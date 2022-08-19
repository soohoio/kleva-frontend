import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './Header2.scss'

import TVL from './TVL'
import Hamburger from './Hamburger'
import LYFPrice from './LYFPrice'
import ConnectWallet from './ConnectWallet'
import { currentTab$ } from '../streams/view'

class Header2 extends Component {

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
      <div className="Header2">
        <div className="Header2__content">
          <div className="Header2__left">
            <img
              onClick={() => {
                currentTab$.next(null)
              }}
              className="Header2__logo"
              src="/static/images/kleva.logo.svg"
            />
          </div>
          <div className="Header2__right">
            <TVL />
            <LYFPrice />
            <Hamburger />
            <ConnectWallet className="Header2__ConnectWallet" />
          </div>
        </div>
      </div>
    )
  }
}

export default Header2