import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of, BehaviorSubject } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './MainPage.scss'
import Header2 from '../components/Header2'
import TabNavigation from '../components/TabNavigation'
import NotificationBanner from '../components/NotificationBanner'
import { currentTab$ } from '../streams/view'
import LendAndStake from '../components/lendnstake/LendAndStake'

class MainPage extends Component {
  destroy$ = new Subject()
  
  
  componentDidMount() {
    merge(
      // 'myAsset', 'lendnstake', 'farming'
      currentTab$,
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

  renderTab = () => {
    if (currentTab$.value == 'lendnstake') {
      return (
        <LendAndStake />
      )
    }
  }
    
  render() {
    return (
      <div className="MainPage">
        <Header2 />
        <TabNavigation />
        <NotificationBanner />
        <div className="MainPage__tabContent">
          {this.renderTab()}
        </div>
      </div>
    )
  }
}

export default MainPage