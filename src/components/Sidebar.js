import React, { Component, Fragment, createRef } from 'react'
import { browserHistory } from 'react-router'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { debounceTime, takeUntil, tap } from 'rxjs/operators'

import { path$ } from 'streams/location'

import './Sidebar.scss'
import { browserHistory$ } from '../streams/location'

const SidebarItem = ({ active, onClickOverwrite, disabled, title, iconSrc, href, clientSideHref }) => {
  return (
    <div
      onClick={() => {

        if (typeof onClickOverwrite === 'function') {
          onClickOverwrite()
          return
        }

        if (disabled) {
          return
        }


        if (clientSideHref) {
          browserHistory$.next(clientSideHref)
          // browserHistory.push(clientSideHref)
          return
        }
        window.open(href)
      }}
      className={cx("SidebarItem", {
        "SidebarItem--active": active,
        "SidebarItem--disabled": disabled,
      })}
    >
      {iconSrc && <img className="SidebarItem__icon" src={iconSrc} />}
      <span className="SidebarItem__title">{title}</span>
    </div>
  )
}

class Sidebar extends Component {
  destroy$ = new Subject()

  componentDidMount() {
    merge(path$).pipe(
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
    return (
      <div className="Sidebar">
        <SidebarItem
          clientSideHref="/lend"
          active={path$.value === "/" || path$.value === "/lend"}
          title="Lend"
        />
        <SidebarItem
          clientSideHref="/stake"
          active={path$.value === "/stake"}
          title="Stake"
        />
        <SidebarItem
          clientSideHref="/farm"
          active={path$.value === "/farm"}
          title="Farm"
        />
      </div>
    )
  }
}

export default Sidebar