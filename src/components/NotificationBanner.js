import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './NotificationBanner.scss'
import Shortcuts from './Shortcuts'
import RollingNoti from './RollingNoti'
import { readNotiMap$ } from '../streams/setting'

class NotificationBanner extends Component {

  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      readNotiMap$,
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

  getItems = () => {
    const items = [
      {
        key: "items001",
        category: 'notice',
        content: 'notice.1',
        href: 'https://bit.ly/3NXDcgN',
      },
    ].filter(({ key }) => {
      return !readNotiMap$.value[key]
    })

    return items
  }
    
  render() {

    const items = this.getItems()

    return (
      <div 
        className={cx("NotificationBanner", {
          "NotificationBanner--noItem": items.length == 0,
        })}
      >
        <div className="NotificationBanner__content">
          <div className="NotificationBanner__left">
            <RollingNoti items={items} />
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