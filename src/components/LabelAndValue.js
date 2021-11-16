import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import './LabelAndValue.scss'

class LabelAndValue  extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    
  }
  
  componentWillUnMount() {
    this.destroy$.next(true)
  }
    
  render() {
    const { className, label, value, color, labelStyle = {}, valueStyle = {} } = this.props

    return (
      <div style={{ color }} className={cx("LabelAndValue", className)}>
        <span style={labelStyle} className="LabelAndValue__label">{label}</span>
        <span style={valueStyle} className="LabelAndValue__value">{value}</span>
      </div>
    )
  }
}

export default LabelAndValue