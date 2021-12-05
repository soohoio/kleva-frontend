import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'
import BigNumber from 'bignumber.js'

import './PositionList.scss'
import { openModal$ } from '../streams/ui'
import ClosePositionPopup from './ClosePositionPopup'
import { tokenList } from '../constants/tokens'
import { aprInfo$ } from '../streams/farming'

// const positions = [
//   {
//     positionId: 10,
//     poolInfo: {
//       title: "AA"
//     },
//     positionValue: 10,
//     debtValue: 10,
//     equityValue: 10,
//     apy: 10,
//     debtRatio: 10,
//     liquidationThreshold: 10,
//     safetyBuffer: 10,

//     farmingToken: tokenList.KSP,
//     baseToken: tokenList.KUSDT,
//   }
// ]

// const positions = [
//   {
//     // action
//     action: "open",

//     // base
//     baseAmount: "431530923069598448",
//     baseEntryPrice: "1000000000000000000",

//     // blocknumber
//     blockNumber: 12519413,

//     // debt
//     debtShare: "0",
//     debtValue: "0",

//     // entry info
//     entryDate: "2021-11-10T02:52:51.000Z",
//     entryPositionEquityValueInBaseToken: "863061846139196895",
//     entryPositionEquityValueInUSD: "863061846139196895",

//     // farm
//     farmAmount: "499374225265084654",
//     farmEntryPrice: "864143364308655104",

//     id: 341803,
//     left: "0",
//     liquidatePrize: "0",
//     liquidatedBy: null,
//     lpAmount: "417834898179701080",
//     owner: "0xa1944e9589d30dc8ea8eac7d1b2ec9729bc29de3",

//     positionId: 47825,
//     positionValueBase: "863061846139196895",
//     totalPositionValueInUSD: { type: "BigNumber", hex: "0x0bfa362d2651d5df" },
    
//     transactionIndex: 92,
//     tx: "0x75345099db35a838a37860d0d97666b9fadae90c211e7c3d916cddf581ecc23c",
//     vault: "0x7c9e73d4c71dae564d41f78d56439bb4ba87592f",
//     worker: "0x4bfe9489937d6c0d7cd6911f1102c25c7cbc1b5a",
//   }
// ]

const PositionItem = ({ 
  id,
  farmingToken,
  baseToken,
  positionValue,
  debtValue,
  exchange, // klayswap
  workerFactorBps, // leverage cap
  killFactorBps, // liquidation threshold

  vaultAddress,
  workerAddress,
}) => {

  const apy = 3000

  const equityValue = new BigNumber(positionValue)
    .minus(debtValue)
    .div(10 ** baseToken.decimals)
    .toNumber()
    .toLocaleString('en-us', { maximumFractionDigits: 6 })
  
  const debtRatio = new BigNumber(debtValue)
    .div(positionValue)
    .toFixed(2)

  const liquidationThreshold = debtValue == 0 
    ? 0
    : Number(killFactorBps / 100)
      .toLocaleString('en-us', { maximumFractionDigits: 2 })

  const safetyBuffer = debtValue == 0 
    ? 0
    : new BigNumber(liquidationThreshold)
      .minus(debtRatio)
      .toNumber()
      .toLocaleString('en-us', { maximumFractionDigits: 2 })

  return (
    <div className="PositionItem">
      <div className="PositionItem__id">
        {baseToken.title} <br />
        #{id}
      </div>
      <div className="PositionItem__info">
        <div className="PositionItem__infoIconList">
          <img className="PositionItem__infoIcon" src={farmingToken.iconSrc} />
          <img className="PositionItem__infoIcon" src={baseToken.iconSrc} />
        </div>
        <div className="PositionItem__infoTitleList">
          <p className="PositionItem__infoTitle">{farmingToken.title}-{baseToken.title}</p>
          <p className="PositionItem__infoExchangeTitle">{exchange}</p>
        </div>
      </div>
      <div className="PositionItem__positionValue">
        <strong>
          {new BigNumber(positionValue)
            .div(10 ** baseToken.decimals)
            .toNumber()
            .toLocaleString('en-us', { maximumFractionDigits: 6 })
          } 
        </strong>
        {baseToken.title}
      </div>
      <div className="PositionItem__debtValue">
        <strong>{new BigNumber(debtValue)
          .div(10 ** baseToken.decimals)
          .toNumber()
          .toLocaleString('en-us', { maximumFractionDigits: 6 })
        }</strong> {baseToken.title}
      </div>
      <div className="PositionItem__equityValue">
        <strong>{equityValue}</strong> {baseToken.title}
      </div>
      <div className="PositionItem__apy">
        <strong>{apy}</strong>%
      </div>
      <div className="PositionItem__debtRatio">
        <strong>{debtRatio}</strong>%
      </div>
      <div className="PositionItem__liquidationThreshold">
        <strong>{liquidationThreshold || 'No Debt'}</strong>{!!liquidationThreshold && '%'}
      </div>
      <div className="PositionItem__safetyBuffer">
        <strong>{safetyBuffer || 'No Debt'}</strong>{!!safetyBuffer && '%'}
      </div>
      <div className="PositionItem__blank">
        <button onClick={() => alert('alpha3')} className="PositionItem__adjustButton">Adjust</button>
        <button className="PositionItem__closeButton" onClick={() => {
          openModal$.next({
            component: (
              <ClosePositionPopup
                title="Close Position"
                farmingToken={farmingToken} 
                baseToken={baseToken} 
                
                positionId={id}
                vaultAddress={vaultAddress}
                workerAddress={workerAddress}
              />
            )
          })
        }}>Close</button>
      </div>
    </div>
  )
}

class PositionList extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      aprInfo$,
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
    const { list } = this.props

    return (
      <div className="PositionList">
        {/* Header */}
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
        <div className="PositionList__content">
          {/* Content */}
          {list.map((positionInfo) => {
            const aprInfo = aprInfo$.value[positionInfo.lpToken.address] || aprInfo$.value[positionInfo.lpToken.address.toLowerCase()]
            return (
              <PositionItem 
                aprInfo={aprInfo}
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