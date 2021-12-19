import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import './Footer.scss'

class Footer extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    
  }
  
  componentWillUnMount() {
    this.destroy$.next(true)
  }
    
  render() {
    
    return (
      <div className="Footer">
        <div className="Footer__left">
          <img 
            onClick={() => window.open('https://docs.kleva.io/v/kor/')}
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

        </div>
      </div>
    )
  }
}

export default Footer