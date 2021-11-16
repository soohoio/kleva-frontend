import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import StakeHeaderInfo from 'components/StakeHeaderInfo'
import StakingPools from 'components/StakingPools'

import PageBuilder from './PageBuilder'

import './StakePage.scss'

class StakePage extends Component {
  destroy$ = new Subject()

  componentDidMount() {

  }

  componentWillUnMount() {
    this.destroy$.next(true)
  }

  render() {

    return (
      <PageBuilder>
        <div className="StakePage">
          <StakeHeaderInfo />
          <StakingPools />
        </div>
      </PageBuilder>
    )
  }
}

export default StakePage