import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import './FarmList.scss'
import FarmItem from './FarmItem'
import { farmPool } from '../constants/farmpool'
import { aprInfo$, farmPoolDeposited$, klevaAnnualRewards$, workerInfo$ } from '../streams/farming'
import { lendingTokenSupplyInfo$ } from '../streams/vault'
import { tokenPrices$ } from '../streams/tokenPrice'
import { selectedAddress$ } from '../streams/wallet'

class FarmList extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      aprInfo$,
      lendingTokenSupplyInfo$,
      workerInfo$,
      klevaAnnualRewards$,
      tokenPrices$,
      farmPoolDeposited$,
      selectedAddress$,
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })
  }
  
  componentWillUnMount() {
    this.destroy$.next(true)
  }
    
  render() {

    return (
      <div className="FarmList">
        <div className="FarmList__header">
          <p className="FarmList__title">Active Farms</p>
        </div>
        <div className="FarmList__content">
          {farmPool.map(({

            workerList,

            token1,
            token2,

            lpToken,
            tvl,
            exchange,
            yieldFarming,
            tradingFee,
          }, idx) => {

            const aprInfo = aprInfo$.value[lpToken.address] || aprInfo$.value[lpToken.address.toLowerCase()]
            
            const token1BorrowingInterest = lendingTokenSupplyInfo$.value[token1.address.toLowerCase()] 
              && lendingTokenSupplyInfo$.value[token1.address.toLowerCase()].borrowingInterest
            
            const token2BorrowingInterest = lendingTokenSupplyInfo$.value[token2.address.toLowerCase()] 
              && lendingTokenSupplyInfo$.value[token2.address.toLowerCase()].borrowingInterest

            return (
              <FarmItem
                key={lpToken && lpToken.address}

                klevaAnnualRewards={klevaAnnualRewards$.value}
                tokenPrices={tokenPrices$.value}
                farmDeposited={farmPoolDeposited$.value[idx]}

                aprInfo={aprInfo}
                workerInfo={workerInfo$.value}
                workerList={workerList}
                token1={token1}
                token2={token2}
                lpToken={lpToken}
                tvl={tvl}
                exchange={exchange}
                yieldFarming={yieldFarming}
                tradingFee={tradingFee}

                selectedAddress={selectedAddress$.value}

                token1BorrowingInterest={token1BorrowingInterest}
                token2BorrowingInterest={token2BorrowingInterest}
              />
            )
          })}
        </div>
      </div>
    )
  }
}

export default FarmList