import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of, interval } from 'rxjs'
import { takeUntil, tap, debounceTime, startWith, switchMap } from 'rxjs/operators'

import './NotificationBanner.scss'
import Shortcuts from './Shortcuts'
import RollingNoti from './RollingNoti'
import { readNotiMap$ } from '../streams/setting'
import { getNotices$, noticeItems$ } from '../streams/notice'
import { currentLocale$ } from '../streams/i18n'

class NotificationBanner extends Component {

  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      readNotiMap$,
      noticeItems$,
      currentLocale$,
    ).pipe(
      debounceTime(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })
    
    interval(1000 * 60 * 5).pipe(
      startWith(0),
      switchMap(() => getNotices$()),
      takeUntil(this.destroy$)
    ).subscribe((notices) => {
      noticeItems$.next(notices)
    })
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }

  getItems = () => {
    return noticeItems$.value.map((item, idx) => {
      return {
        key: idx,
        category: 'notice',
        content: item[currentLocale$.value],
        href: item.href,
      }
    })
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