import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { debounceTime, distinctUntilChanged, takeUntil, tap } from 'rxjs/operators'

import './Footer.scss'
import { showFooter$ } from '../streams/ui'
import LanguageChange from './LanguageChange'

class Footer extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      showFooter$.pipe(
        distinctUntilChanged()
      )
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
      <div 
        className={cx("Footer", {
          "Footer--show": showFooter$.value
        })}
      >
        <div className="Footer__content">
          <div className="Footer__contentHeader">
            <div className="Footer__socials">
              <img 
                className="Footer__icon" 
                onClick={() => {
                  window.open('https://docs.kleva.io')
                }}
                src="/static/images/common/icon_footer_gitbook.svg" 
              />
              <img 
                className="Footer__icon" 
                onClick={() => {
                  window.open('https://mobile.twitter.com/kleva_protocol')
                }}
                src="/static/images/common/icon_footer_twitter.svg" 
              />
              <img 
                className="Footer__icon" 
                onClick={() => {
                  window.open('https://t.me/klevaprotocol_official')
                }}
                src="/static/images/common/icon_footer_telegram.svg" 
              />
              <img 
                className="Footer__icon" 
                onClick={() => {
                  window.open('https://medium.com/@KLEVA_Protocol_official')
                }}
                src="/static/images/common/icon_footer_medium.svg" 
              />
            </div>
            <LanguageChange />
          </div>
          <div className="Footer__project">
            <img src="/static/images/common/footer_logo.svg" className="Footer__projectName" />
            <p className="Footer__copyright">ⓒ WEMIX PTE. LTD. All Rights Reserved.</p>
          </div>
        </div>
      </div>
    )
  }
}

export default Footer