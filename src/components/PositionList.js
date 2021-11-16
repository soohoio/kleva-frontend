import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import './PositionList.scss'

const positions = [
  {
    positionId: 10,
    poolInfo: {
      title: "AA"
    },
    positionValue: 10,
    debtValue: 10,
    equityValue: 10,
    apy: 10,
    debtRatio: 10,
    liquidationThreshold: 10,
    safetyBuffer: 10,
  }
]

const PositionItem = ({ 
  positionId,
  poolInfo,
  positionValue,
  debtValue,
  equityValue,
  apy,
  debtRatio,
  liquidationThreshold,
  safetyBuffer,
}) => {
  return (
    <div className="PositionItem">
      <div className="PositionItem__id">#{positionId}</div>
      <div className="PositionItem__title">
        {poolInfo.title}
      </div>
      <div className="PositionItem__positionValue">
        {positionValue}
      </div>
      <div className="PositionItem__debtValue">
        {debtValue}
      </div>
      <div className="PositionItem__equityValue">
        {equityValue}
      </div>
      <div className="PositionItem__apy">
        {apy}
      </div>
      <div className="PositionItem__debtRatio">
        {debtRatio}
      </div>
      <div className="PositionItem__liquidationThreshold">
        {liquidationThreshold}
      </div>
      <div className="PositionItem__safetyBuffer">
        {safetyBuffer}
      </div>
      <div className="PositionItem__blank">
        <button>Adjust</button>
        <button>Close</button>
      </div>
    </div>
  )
}

class PositionList extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    
  }
  
  componentWillUnMount() {
    this.destroy$.next(true)
  }
    
  render() {
    
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
          {positions.map((positionInfo) => {
            return <PositionItem {...positionInfo} />
          })}
        </div>
      </div>
    )
  }
}

export default PositionList