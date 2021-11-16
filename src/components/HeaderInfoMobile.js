import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import './HeaderInfoMobile.scss'

const Item = ({ title, value }) => {
  return (
    <div className="HeaderInfoMobile__item">
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
        <Item title="Total Value Locked" value="999999" />
        <Item title="KLEVA" value ="32.54" />
      </div>
    )
  }
}

export default HeaderInfoMobile