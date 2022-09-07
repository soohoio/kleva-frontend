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
import Farming from '../components/farming/Farming'
import MyAsset from '../components/myasset/MyAsset'
import Footer from '../components/Footer'
import Dashboard from '../components/dashboard/Dashboard'
import Withus from '../components/intro/Withus'
import UseGuide from '../components/intro/UseGuide'
import { contentView$, isDesktop$ } from '../streams/ui'

class MainPage extends Component {
  destroy$ = new Subject()

  componentDidMount() {
    merge(
      // 'myAsset', 'lendnstake', 'farming'
      currentTab$,
      contentView$,
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

    if (currentTab$.value == 'myasset') {
      return <MyAsset />
    }

    if (currentTab$.value == 'lendnstake') {
      return (
        <LendAndStake />
      )
    }

    if (currentTab$.value == 'farming') {
      return (
        <Farming />
      )
    }

    if (currentTab$.value == 'dashboard') {
      return (
        <Dashboard />
      )
    }
    
    if (currentTab$.value == 'withus') {
      return (
        <Withus />
      )
    }
    
    if (currentTab$.value == 'useguide') {
      return (
        <UseGuide />
      )
    }
  }

  render() {

    console.log(contentView$.value, 'contentView$.value')

    return (
      <div className="MainPage">
        <Header2 />
        <TabNavigation />
        <NotificationBanner />
        <div className={cx("MainPage__tabContent", {
          [`MainPage__tabContent--${currentTab$.value}`]: true,
          [`MainPage__tabContent--${!contentView$.value?.component && 'contentless'}`]: true,
          [`MainPage__tabContent--${contentView$.value?.key}`]: true,
        })}>
          {this.renderTab()}
        </div>
        <Footer />
      </div>
    )
  }
}

export default MainPage