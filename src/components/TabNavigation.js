import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './TabNavigation.scss'
import { I18n } from './common/I18n'
import { currentTab$ } from '../streams/view'
import SubMenu from './Submenu'

const TabNavigationItem = ({ onClick, isActive, title }) => {
  return (
    <div 
      onClick={onClick}
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
        <div className="TabNavigation__content">
          <div className="TabNavigation__tabs">
            <TabNavigationItem onClick={() => currentTab$.next('myasset')} isActive={currentTab$.value === 'myasset'} title={I18n.t('myasset')} />
            <TabNavigationItem onClick={() => currentTab$.next('lendnstake')} isActive={currentTab$.value === 'lendnstake'} title={I18n.t('lendnstake')} />
            <TabNavigationItem onClick={() => currentTab$.next('farming')} isActive={currentTab$.value === 'farming'} title={I18n.t('farming1')} />
          </div>
          <div className="TabNavigation__right">
            <SubMenu />
          </div>
        </div>
      </div>
    )
  }
}

export default TabNavigation