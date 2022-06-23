import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './TabNavigation.scss'
import { I18n } from './common/I18n'
import { currentTab$ } from '../streams/view'

const TabNavigationItem = ({ isActive, title }) => {
  return (
    <div 
      className={cx("TabNavigationItem", {
        "TabNavigationItem--active": isActive,
      })}
    >
      <p className="TabNavigationItem__title">{title}</p>
    </div>
  )
}

class TabNavigation extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      currentTab$,
    ).pipe(
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
      <div className="TabNavigation">
        <TabNavigationItem isActive={currentTab$.value === 'myasset'} title={I18n.t('myasset')} />
        <TabNavigationItem isActive={currentTab$.value === 'lendnstake'} title={I18n.t('lendnstake')} />
        <TabNavigationItem isActive={currentTab$.value === 'farming'} title={I18n.t('farming')} />
      </div>
    )
  }
}

export default TabNavigation