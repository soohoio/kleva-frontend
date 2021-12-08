import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import './HeaderInfoMobile.scss'

const Item = ({ imgSrc, title, value }) => {
  return (
    <div className="HeaderInfoMobile__item">
      {imgSrc && <img className="HeaderInfoMobile__itemImage" src={imgSrc} />}
      <span className="HeaderInfoMobile__itemTitle">{title}</span>
      <span className="HeaderInfoMobile__itemValue">{value}</span>
    </div>
  )
}

class HeaderInfoMobile extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    
  }
  
  componentWillUnMount() {
    this.destroy$.next(true)
  }
    
  render() {
    return (
      <div className="HeaderInfoMobile">
        <div className="HeaderInfoMobile__top">
          <div className="HeaderInfoMobile__item">
            <span className="HeaderInfoMobile__itemTitle">Total Value Locked</span>
            <span className="HeaderInfoMobile__itemValue">$999,999</span>
          </div>
          <div className="HeaderInfoMobile__item">
            <div className="HeaderInfoMobile__itemLeft">
              <div className="HeaderInfoMobile__itemImage" />
              <span className="HeaderInfoMobile__itemTitle">KLEVA</span>
            </div>
            <span className="HeaderInfoMobile__itemValue">$32.54</span>
          </div>
        </div>
        <div className="HeaderInfoMobile__developedByWrapper">
          <span className="HeaderInfoMobile__developedBy">Developed by</span>
          <div className="HeaderInfoMobile__images"> 
            <img className="HeaderInfoMobile__developedTeamIcon" src="/static/images/logo-wmt@3x.png" />
            <div className="HeaderInfoMobile__circle" />
            <img className="HeaderInfoMobile__developedTeamIcon" src="/static/images/logo-sooho@3x.png" />
            <div className="HeaderInfoMobile__circle" />
            <img className="HeaderInfoMobile__developedTeamIcon" src="/static/images/logo-bos@3x.png" />
          </div>
        </div>
      </div>
    )
  }
}

export default HeaderInfoMobile