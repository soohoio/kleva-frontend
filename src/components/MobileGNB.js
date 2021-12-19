import React, { Component, Fragment, createRef } from 'react'
import { browserHistory } from 'react-router'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import { path$ } from 'streams/location'
import { closeModal$ } from 'streams/ui'

import './MobileGNB.scss'

const SidebarItem = ({ onClickOverwrite, href, clientSideHref, active, title, iconSrc }) => {
  return (
    <div
      className={cx("SidebarItem", {
        "SidebarItem--active": active
      })}
      onClick={() => {

        if (typeof onClickOverwrite === 'function') {
          onClickOverwrite()
          return
        }

        if (clientSideHref) {
          browserHistory.push(clientSideHref)
          closeModal$.next(true)
          return
        }

        window.open(href)
        closeModal$.next(true)
      }}
    >
      {iconSrc && <img className="SidebarItem__icon" src={iconSrc} />}
      <span className="SidebarItem__title">{title}</span>
    </div>
  )
}

class MobileGNB extends Component {
  destroy$ = new Subject()

  componentDidMount() {
    merge(
      path$
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })
  }

  componentWillUnMount() {
    this.destroy$.next(true)
  }

  render() {
    return (
      <div className="MobileGNB">
        <div className="MobileGNB__header">
          <img className="MobileGNB__headerLogo" src="/static/images/logo-kleva-blue.svg" />
          <img 
            onClick={() => closeModal$.next(true)} 
            className="MobileGNB__close" 
            src="/static/images/close-black.svg" 
          />
        </div>
        <SidebarItem
          clientSideHref="/lend"
          title="Lend"
          active={path$.value === '/' || path$.value === '/lend'}
        />
        <SidebarItem
          clientSideHref="/stake"
          title="Stake"
          active={path$.value === '/stake'}
        />
        <SidebarItem
          onClickOverwrite={() => alert("Coming Soon.")}
          clientSideHref="/farm"
          title="Farm"
          active={path$.value === '/farm'}
        />
      </div>
    )
  }
}

export default MobileGNB