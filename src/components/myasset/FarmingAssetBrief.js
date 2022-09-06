import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './FarmingAssetBrief.scss'
import { nFormatter } from '../../utils/misc'

class FarmingAssetBrief extends Component {

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
    const { farmingPositionValues, totalInUSD } = this.props

    return (
      <div className="FarmingAssetBrief">
        <p className="FarmingAssetBrief__total">${nFormatter(totalInUSD, 2)}</p>
        <div className="FarmingAssetBrief__gauge">
          {farmingPositionValues.map(({ title, balanceTotalInUSD }, idx) => {

            const percentage = new BigNumber(balanceTotalInUSD).div(totalInUSD).multipliedBy(100).toNumber()

            return (
              <div
                style={{ flex: `${Math.max(percentage, 1)}` }}
                className={cx("FarmingAssetBrief__gaugeItem", {
                  [`FarmingAssetBrief__gaugeItem--${(idx + 1) % 11}`]: true,
                })}
              />
            )
          })}
        </div>
        <div className="FarmingAssetBrief__gaugeLabels">
          {farmingPositionValues.map(({ title, balanceTotalInUSD }, idx) => {
            const percentage = new BigNumber(balanceTotalInUSD)
              .div(totalInUSD)
              .multipliedBy(100)
              .toNumber()

            return (
              <span
                className={cx("FarmingAssetBrief__gaugeLabel", {
                  [`FarmingAssetBrief__gaugeLabel--${(idx + 1) % 11}`]: true,
                })}
              >
                {title} <span className="FarmingAssetBrief__percentage">{percentage.toFixed(1)}%</span>
              </span>
            )
          })}
        </div>
      </div>
    )
  }
}

export default FarmingAssetBrief