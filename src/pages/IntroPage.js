import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of, BehaviorSubject, interval, fromEvent } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './MainPage.scss'
import Header2 from '../components/Header2'
import TabNavigation from '../components/TabNavigation'
import NotificationBanner from '../components/NotificationBanner'

import './IntroPage.scss'
import Intro1 from '../components/intro/Intro1'
import Intro2 from '../components/intro/Intro2'
import Intro3 from '../components/intro/Intro3'
import Intro4 from '../components/intro/Intro4'
import Intro5 from '../components/intro/Intro5'
import Intro6 from '../components/intro/Intro6'
import FAQ from '../components/intro/FAQ'
import Footer from '../components/Footer'

class IntroPage extends Component {
  $app = createRef()

  destroy$ = new Subject()

  touched$ = new BehaviorSubject()
  
  componentDidMount() {
    merge(
      this.touched$,
    ).pipe(
      debounceTime(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })

    // merge(
    //   fromEvent(this.$app.current, 'click'),
    //   fromEvent(this.$app.current, 'touchstart'),
    // ).pipe(
    //   takeUntil(this.destroy$)
    // ).subscribe(() => {
    //   this.touched$.next(true)
    // })
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }
    
  render() {
    return (
      <div className="IntroPage">
        <Header2 />
        <TabNavigation />
        <NotificationBanner />
        <div ref={this.$app} className="IntroPage__tabContent">
          <Intro1 
            shouldShow={true}
          />
          <Intro2 />
          <Intro3 />
          <Intro4 />
          <Intro5 />
          <Intro6 />
          <FAQ />
        </div>
        <Footer />
      </div>
    )
  }
}

export default IntroPage