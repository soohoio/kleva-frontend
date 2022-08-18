import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './LendNStakeAssetBrief.scss'
import { nFormatter } from '../../utils/misc'

class LendNStakeAssetBrief extends Component {

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
    const { ibTokenBalances, totalInUSD } = this.props

    return (
      <div className="LendNStakeAssetBrief">
        <p className="LendNStakeAssetBrief__total">${nFormatter(totalInUSD, 2)}</p>
        <div className="LendNStakeAssetBrief__gauge">
          {ibTokenBalances.map(({ title, balanceTotalInUSD }) => {

            const percentage = new BigNumber(balanceTotalInUSD).div(totalInUSD).multipliedBy(100).toNumber()
            
            return (
              <div 
                style={{ flex: `${Math.max(percentage, 1)}` }}
                className={cx("LendNStakeAssetBrief__gaugeItem", {
                  [`LendNStakeAssetBrief__gaugeItem--${title}`]: true, 
                })}
              />
            )
          })}
        </div>
        <div className="LendNStakeAssetBrief__gaugeLabels">
          {ibTokenBalances.map(({ title, balanceTotalInUSD }) => {
            const percentage = new BigNumber(balanceTotalInUSD)
              .div(totalInUSD)
              .multipliedBy(100)
              .toNumber()

            return (
              <span 
                className={cx("LendNStakeAssetBrief__gaugeLabel", {
                  [`LendNStakeAssetBrief__gaugeLabel--${title}`]: true,
                })}
              >
                {title} <span className="LendNStakeAssetBrief__percentage">{percentage.toFixed(1)}%</span>
              </span>
            )
          })}
        </div>
      </div>
    )
  }
}

export default LendNStakeAssetBrief