import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of, BehaviorSubject } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './MainPage.scss'
import Header2 from '../components/Header2'
import TabNavigation from '../components/TabNavigation'

class MainPage extends Component {
  destroy$ = new Subject()
  
  // 'myAsset', 'lendnstake', 'farming'
  tab$ = new BehaviorSubject()
  
  componentDidMount() {
    merge(
      this.tab$,
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
    
  }
    
  render() {
    return (
      <div className="MainPage">
        <Header2 />
        <TabNavigation />
      </div>
    )
  }
}

export default MainPage