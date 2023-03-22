import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { debounceTime, distinctUntilChanged, takeUntil, tap } from 'rxjs/operators'

import './Footer.scss'
import { showFooter$ } from '../streams/ui'
import LanguageChange from './LanguageChange'
import { I18n } from './common/I18n'

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
                  window.open("https://discord.gg/kleva")
                }}
                src="/static/images/common/icon_footer_discord.svg?date=20220929"
              />
              <img
                className="Footer__icon"
                onClick={() => {
                  window.open('https://medium.com/@KLEVA_Protocol_official')
                }}
                src="/static/images/common/icon_footer_medium2.svg?date=20220929"
              />
              <img
                className="Footer__icon"
                onClick={() => {
                  window.open('https://mobile.twitter.com/kleva_protocol')
                }}
                src="/static/images/common/icon_footer_twitter.svg?date=20220929"
              />
              <img
                className="Footer__icon"
                onClick={() => {
                  window.open('https://t.me/klevaprotocol_official')
                }}
                src="/static/images/common/icon_footer_telegram.svg?date=20220929"
              />
              <img 
                className="Footer__icon" 
                onClick={() => {
                  window.open(I18n.t('docs.kleva.io'))
                }}
                src="/static/images/common/icon_footer_gitbook.svg?date=20220929" 
              />
            </div>
            <LanguageChange 
              upper
            />
          </div>
          <div className="Footer__project">
            <img src="/static/images/common/footer_logo.svg?date=20220929" className="Footer__projectName" />
            <p className="Footer__copyright">ⓒ WEMIX PTE. LTD. All Rights Reserved.</p>
          </div>
        </div>
      </div>
    )
  }
}

export default Footer