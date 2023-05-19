import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import './BeforeAfter.scss'

class BeforeAfter extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }
    
  render() {
    const { before, after } = this.props
    let { imgSrc } = this.props

    imgSrc = imgSrc || "/static/images/arrow-right2.svg?date=20220929"

    return (
      <div className={cx("BeforeAfter")}>
        <div className="BeforeAfter__before">{before}</div>
        <img className="BeforeAfter__arrow" src={imgSrc} />
        <div className="BeforeAfter__after">{after}</div>
      </div>
    )
  }
}

export default BeforeAfter