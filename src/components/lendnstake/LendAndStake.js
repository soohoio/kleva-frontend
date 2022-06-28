import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'
import { I18n } from '../common/I18n'

import Bloc from './LendAndStake.bloc'
import './LendAndStake.scss'
import LendingPoolList from '../LendingPoolList';

class LendAndStake extends Component {
  bloc = new Bloc(this)

  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      of(true),
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
    
  render() {
    
    return (
      <div className="LendAndStake">
        <div className="LendAndStake__intro">
          <p className="LendAndStake__introTitle">
            {I18n.t('lendnstake.intro.title')}
          </p>
          <p className="LendAndStake__introDescription">
            {I18n.t('lendnstake.intro.description')}
          </p>
          <p className="LendAndStake__introMisc">
            {I18n.t('lendnstake.intro.misc')}
          </p>
        </div>
        <div className="LendAndStake__list">
          <LendingPoolList />
        </div>
      </div>
    )
  }
}

export default LendAndStake