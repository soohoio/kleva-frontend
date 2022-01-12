import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import './DetailedHideable.scss'

class DetailedHideable extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }
    
  render() {
    const { title, className, showDetail$, children } = this.props
    return (
      <div className={cx("DetailedHideable", className)}>
        <div className="DetailedHideable__header">
          <span className="DetailedHideable__title">{title}</span>
          <button onClick={() => showDetail$.next(false)} className="DetailedHideable__hideButton">Hide</button>
        </div>
        <div className="DetailedHideable__content">
          {children}
        </div>
      </div>
    )
  }
}

export default DetailedHideable