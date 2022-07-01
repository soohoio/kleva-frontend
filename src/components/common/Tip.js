import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './Tip.scss'

class Tip extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    const { isOpened$ } = this.props
    merge(
      isOpened$,
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
    const { title, content, isOpened$ } = this.props
    return !!isOpened$.value && (
      <div className="Tip">
        <img 
          onClick={() => {
            isOpened$.next(false)
          }} 
          className="Tip__close" 
          src="/static/images/close-small.svg" 
        />
        <div className="Tip__title">{title}</div>
        <div className="Tip__description">{content}</div>
      </div>
    )
  }
}

export default Tip