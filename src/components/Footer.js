import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { debounceTime, distinctUntilChanged, takeUntil, tap } from 'rxjs/operators'

import './Footer.scss'
import { showFooter$ } from '../streams/ui'

const partners = [
  { imgSrc: '/static/images/logo-klayfi.svg' }
]

const audits = [
  { imgSrc: '/static/images/logo-sooho@3x.png' },
  { imgSrc: '/static/images/logo-scvsoft@3x.png' },
]

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
      <div className={cx("Footer", {
        "Footer--show": showFooter$.value
      })}>
        <div className="Footer__left">
          <img 
            onClick={() => window.open('https://docs.kleva.io')}
            className="Footer__socialLink" 
            src="/static/images/icons-social-gitbook.svg" 
          />
          <img 
            onClick={() => window.open('https://t.me/klevaprotocol_official')}
            className="Footer__socialLink" 
            src="/static/images/icons-social-telegram.svg" 
          />
          <img 
            onClick={() => window.open('https://twitter.com/KLEVA_Protocol')}
            className="Footer__socialLink" 
            src="/static/images/icons-social-twitter.svg" 
          />
          <img 
            onClick={() => window.open('https://medium.com/@KLEVA_Protocol_official')}
            className="Footer__socialLink" 
            src="/static/images/icons-social-medium.svg" 
          />
        </div>
        <div className="Footer__right">
          <span className="Footer__itemCategory">Partners</span>
          <img onClick={() => window.open('https://klayfi.finance')} className="Footer__logoImage Footer__logoImage--klayfi" src="/static/images/logo-klayfi.svg" />
          <span className="Footer__itemCategory">Audit</span>
          <img onClick={() => window.open('https://audit.sooho.io')} className="Footer__logoImage Footer__logoImage--sooho" src="/static/images/logo-sooho@3x.png" />
          <img onClick={() => window.open('https://scvsoft.net/')} className="Footer__logoImage Footer__logoImage--scvsoft" src="/static/images/logo-scvsoft@3x.png" />
        </div>
      </div>
    )
  }
}

export default Footer