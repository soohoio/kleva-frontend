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
import Glossary from '../components/intro/Glossary'
import { getQS } from '../utils/misc'

class MainPage extends Component {
  destroy$ = new Subject()

  componentDidMount() {
    merge(
      // 'myAsset', 'lendnstake', 'farming'
      currentTab$,
      isDesktop$,
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

    if (currentTab$.value.indexOf('myasset') !== -1) {
      const qs = getQS({
        search: String(currentTab$.value)
      })

      return <MyAsset defaultAssetMenu={qs?.assetMenu} />
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

    if (currentTab$.value == 'glossary') {
      return (
        <Glossary />
      )
    }
  }

  render() {

    const staticPage = (!isDesktop$.value && ['dashboard', 'withus', 'useguide', 'glossary'].includes(currentTab$.value)) ||
      (!isDesktop$.value && ['farming', 'myasset'].includes(currentTab$.value) && !!contentView$.value?.component)

    return (
      <div 
        className={cx("MainPage", {
          [`MainPage--${currentTab$.value}`]: true,
          [`MainPage--staticPage`]: staticPage
        })}
      >
        <div 
          className={cx("MainPage__top")}
        >
          <Header2 />
          <TabNavigation />
          <NotificationBanner />
        </div>
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