import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import './LendPage.scss'
import LendingPoolList from '../components/LendingPoolList'
import PageBuilder from './PageBuilder'
import TVLBrief from '../components/TVLBrief'

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
            <TVLBrief />
            <div className="LendPage__briefFooter">
              <span className="LendPage__developedBy">Developed by</span>
              <img className="LendPage__developedTeamIcon" src="/static/images/logo-wmt@3x.png" />
              <div className="LendPage__circle" />
              <img className="LendPage__developedTeamIcon" src="/static/images/logo-sooho@3x.png" />
              <div className="LendPage__circle" />
              <img className="LendPage__developedTeamIcon" src="/static/images/logo-bos@3x.png" />
            </div>
          </div>
          <LendingPoolList />
        </div>
      </PageBuilder>
    )
  }
}

export default LendPage