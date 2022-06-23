import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import './Checkbox.scss'

class Checkbox extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }
    
  render() {
    const { label, checked$, className } = this.props
    
    return (
      <div onClick={() => checked$.next(!checked$.value)} className={cx("Checkbox", className)}>
        <div 
          className={cx("Checkbox__image", {
            "Checkbox__image--checked": !!checked$.value,
          })} 
        />
        <span className="Checkbox__label">{label}</span>
      </div>
    )
  }
}

export default Checkbox