import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import './LendPage.scss'
import LendingPoolList from '../components/LendingPoolList'
import PageBuilder from './PageBuilder'

class LendPage extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    
  }
  
  componentWillUnMount() {
    this.destroy$.next(true)
  }
    
  render() {
    
    return (
      <PageBuilder>
        <div className="LendPage">
          <div className="LendPage__brief">

          </div>
          <LendingPoolList />
        </div>
      </PageBuilder>
    )
  }
}

export default LendPage