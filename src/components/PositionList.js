import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'
import BigNumber from 'bignumber.js'

import './PositionList.scss'
import { openModal$ } from '../streams/ui'
import ClosePositionPopup from './ClosePositionPopup'
import { lpTokenByIngredients, tokenList } from '../constants/tokens'
import { aprInfo$, positions$, workerInfo$ } from '../streams/farming'
import AdjustPositionPopup from './AdjustPositionPopup'

const PositionItem = ({ 
  id,
  positionId,
  farmingToken,
  baseToken,
  positionValue,
  debtValue,
  exchange, // klayswap
  workFactorBps, // leverage cap
  killFactorBps, // liquidation threshold

  vaultAddress,
  workerAddress,

  workerInfo,
}) => {

  const lpToken = lpTokenByIngredients(farmingToken, baseToken)

  const apy = 3000
  
  const debtRatio = new BigNumber(debtValue || 0)
    .div(positionValue || 1)
    .toFixed(2)

  const positionValueParsed = new BigNumber(positionValue)
    .div(10 ** baseToken.decimals)
    .toNumber()
    .toLocaleString('en-us', { maximumFractionDigits: 6 })

  const equityValueParsed = new BigNumber(positionValue)
    .minus(debtValue)
    .div(10 ** baseToken.decimals)
    .toNumber()
    .toLocaleString('en-us', { maximumFractionDigits: 6 })

  const debtValueParsed = new BigNumber(debtValue)
    .div(10 ** baseToken.decimals)
    .toNumber()
    .toLocaleString('en-us', { maximumFractionDigits: 6 })

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

  const leverageCap = 10000 / (10000 - Number(workFactorBps))

  return (
    <div className="PositionItem">
      <div className="PositionItem__id">
        {baseToken.title} <br />
        #{positionId}
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
        <strong>{equityValueParsed}</strong> {baseToken.title}
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
        <button onClick={() => {
          openModal$.next({
            component: <AdjustPositionPopup
              title="Adjust Position"
              positionId={positionId}
              vaultAddress={vaultAddress}
              farmingToken={farmingToken}
              baseToken={baseToken}
              workerInfo={workerInfo}
              leverageCap={leverageCap}
            />
          })

          
        }} className="PositionItem__adjustButton">Adjust</button>
        <button className="PositionItem__closeButton" onClick={() => {
          openModal$.next({
            component: (
              <ClosePositionPopup
                title="Close Position"
                positionId={positionId}
                vaultAddress={vaultAddress}
                farmingToken={farmingToken} 
                baseToken={baseToken}
                workerInfo={workerInfo}
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
      workerInfo$,
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
            const workerInfo = workerInfo$.value[positionInfo.workerAddress] || workerInfo$.value[positionInfo.workerAddress.toLowerCase()]
            return (
              <PositionItem 
                key={positionInfo && positionInfo.id}
                aprInfo={aprInfo}
                workerInfo={workerInfo}
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