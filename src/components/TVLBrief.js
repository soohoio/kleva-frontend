import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { debounceTime, takeUntil, tap } from 'rxjs/operators'

import './TVLBrief.scss'
import { tokenPrices$ } from '../streams/tokenPrice'
import { lendingPools } from '../constants/lendingpool'
import { lendingTokenSupplyInfo$ } from '../streams/vault'
import { farmPoolDeposited$ } from '../streams/farming'
import RollingBanner from './RollingBanner'

class TVLBrief extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      tokenPrices$,
      lendingTokenSupplyInfo$,
      farmPoolDeposited$,
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

  getTVL = () => {

    const lendingPoolTVL = lendingPools.reduce((acc, { stakingToken, vaultAddress }) => {

      // Lending Pool TVL Info
      const lendingTokenSupplyInfo = lendingTokenSupplyInfo$.value[vaultAddress]
      const depositedTokenBalance = lendingTokenSupplyInfo && lendingTokenSupplyInfo.depositedTokenBalance
      const totalUnborrowed = lendingTokenSupplyInfo && lendingTokenSupplyInfo.totalUnborrowed

      const tvl = new BigNumber(depositedTokenBalance)
        .multipliedBy(tokenPrices$.value[stakingToken.address.toLowerCase()])
        .toNumber()

      return acc += isNaN(tvl) ? 0 : tvl
    }, 0)

    const farmPoolTVL = farmPoolDeposited$.value && Object.values(farmPoolDeposited$.value).reduce((acc, cur) => {

      const _farmTVL = new BigNumber(cur && cur.deposited)
        .multipliedBy(tokenPrices$.value[cur && cur.lpToken && cur.lpToken.address.toLowerCase()])

      return new BigNumber(acc).plus(_farmTVL).toNumber()
    }, 0)

    return new BigNumber(lendingPoolTVL)
      .plus(farmPoolTVL)
      .toNumber()
  }
    
  render() {

    return (
      <div className="TVLBrief">
        <div className="TVLBrief__left">
          <p className="TVLBrief__title">Total Value Locked</p>
          <p className="TVLBrief__description">${this.getTVL().toLocaleString('en-us', { maximumFractionDigits: 2 })}</p>
        </div>
        <div className="TVLBrief__right">
          <RollingBanner />
          {/* <div className="TVLBrief__banner">
            Marketing Communcation Banners
          </div> */}
        </div>
      </div>
    )
  }
}

export default TVLBrief