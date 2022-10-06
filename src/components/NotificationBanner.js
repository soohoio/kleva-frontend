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
        content: 'notice.3',
        href: 'https://medium.com/@KLEVA_Protocol_official/493a5adb75e9',
      },
      {
        key: "items002",
        category: 'notice',
        content: 'notice.4',
        href: 'https://medium.com/@KLEVA_Protocol_official/1baf4687e1c8',
      },
      {
        key: "items003",
        category: 'notice',
        content: 'notice.1',
        href: 'https://klevaprotocol.info/UX_Update_Main',
      },
    ]

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