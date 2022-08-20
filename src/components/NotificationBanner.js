import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './NotificationBanner.scss'
import Shortcuts from './Shortcuts'
import RollingNoti from './RollingNoti'

class NotificationBanner extends Component {

  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      of(true),
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
    const items = [
      { category: 'notice', content: 'notice.1' }
    ]
    
    return (
      <div className="NotificationBanner">
        <div className="NotificationBanner__content">
          <div className="NotificationBanner__left">
            <RollingNoti />
          </div>
          <div className="NotificationBanner__right">
            <Shortcuts />
          </div>
        </div>
      </div>
    )
  }
}

export default NotificationBanner