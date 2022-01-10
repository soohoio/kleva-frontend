import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'
import BigNumber from 'bignumber.js'

import './PositionList.scss'
import { openModal$ } from '../streams/ui'
import PositionItem from './PositionItem'
import ClosePositionPopup from './ClosePositionPopup'
import { aprInfo$, klevaAnnualRewards$, workerInfo$ } from '../streams/farming'
import KilledPositionItem from './KilledPositionItem'
import { lendingTokenSupplyInfo$ } from '../streams/vault'
import { tokenPrices$ } from '../streams/tokenPrice'

class PositionList extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      aprInfo$,
      workerInfo$,
      lendingTokenSupplyInfo$,
      tokenPrices$,
      klevaAnnualRewards$,
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
    const { list, view } = this.props

    return (
      <div className={cx("PositionList", {
        "PositionList--killed": view === "liquidated",
      })}>
        {/* Header */}
        {view === "active" 
          ? (
            <div className="PositionList__header">
              <div className="PositionList__headerNumber">#</div>
              <div className="PositionList__headerPool">Pool</div>
              <div className="PositionList__headerPositionValue">Position Value</div>
              <div className="PositionList__headerDebtValue">Debt Value</div>
              <div className="PositionList__headerEquityValue">Equity Value</div>
              <div className="PositionList__headerCurrentAPY">Current APY</div>
              <div className="PositionList__headerDebtRatio">Debt Ratio</div>
              <div className="PositionList__headerLiquidationThreshold">Liquidation Threshold</div>
              <div className="PositionList__headerSafetyBuffer">Safety Buffer</div>
              <div className="PositionList__headerBlank"></div>
            </div>
          )
          : (
            <div className="PositionList__header">
              <div className="PositionList__headerNumber">#</div>
              <div className="PositionList__headerPool">Pool</div>
              <div className="PositionList__headerDebtValue">Debt size at liquidation</div>
              <div className="PositionList__headerPositionValue">Position size at liquidation</div>
              <div className="PositionList__headerReturnedAmount">Returned amount</div>
              <div className="PositionList__headerTxRecord">Tx Record</div>
            </div>
          )
        }
        <div className="PositionList__content">
          {/* Content */}
          {list.map((positionInfo) => {
            const aprInfo = aprInfo$.value[positionInfo.lpToken.address] || aprInfo$.value[positionInfo.lpToken.address.toLowerCase()]
            const workerInfo = workerInfo$.value[positionInfo.workerAddress] || workerInfo$.value[positionInfo.workerAddress.toLowerCase()]

            return view === "active" 
              ? (
                  <PositionItem 
                    key={positionInfo && positionInfo.id}
                    lendingTokenSupplyInfo={lendingTokenSupplyInfo$.value}
                    tokenPrices={tokenPrices$.value}
                    klevaAnnualRewards={klevaAnnualRewards$.value}
                    aprInfo={aprInfo}
                    workerInfo={workerInfo}
                    {...positionInfo}
                  />
              )
              : (
                <KilledPositionItem 
                  key={positionInfo && positionInfo.id}
                  {...positionInfo}
                />
              )
          })}
        </div>
      </div>
    )
  }
}

export default PositionList