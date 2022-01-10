import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import BigNumber from 'bignumber.js'

import { openModal$ } from '../streams/ui'
import ClosePositionPopup from './ClosePositionPopup'
import { lpTokenByIngredients } from '../constants/tokens'
import AdjustPositionPopup from './AdjustPositionPopup'

import './KilledPositionItem.scss'

class KilledPositionItem extends Component {
  destroy$ = new Subject()

  componentDidMount() {

  }

  componentWillUnmount() {
    this.destroy$.next(true)
  }

  render() {
    const {
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

      positionValueAtKilled,
      debtAtKilled,
      restAmountAtKilled,
      prizeAtKilled,
      killedTx,
    } = this.props

    const positionValueParsed = new BigNumber(positionValueAtKilled)
      .div(10 ** baseToken.decimals)
      .toNumber()
      .toLocaleString('en-us', { maximumFractionDigits: 6 })

    const debtValueParsed = new BigNumber(debtAtKilled)
      .div(10 ** baseToken.decimals)
      .toNumber()
      .toLocaleString('en-us', { maximumFractionDigits: 6 })

    const restAmountParsed = new BigNumber(restAmountAtKilled)
      .div(10 ** baseToken.decimals)
      .toNumber()
      .toLocaleString('en-us', { maximumFractionDigits: 6 })

    return (
      <div className="KilledPositionItem">
        <div className="KilledPositionItem__id">
          {baseToken.title} <br />
        #{positionId}
        </div>
        <div className="KilledPositionItem__info">
          <div className="KilledPositionItem__infoIconList">
            <img className="KilledPositionItem__infoIcon" src={farmingToken.iconSrc} />
            <img className="KilledPositionItem__infoIcon" src={baseToken.iconSrc} />
          </div>
          <div className="KilledPositionItem__infoTitleList">
            <p className="KilledPositionItem__infoTitle">{farmingToken.title}-{baseToken.title}</p>
            <p className="KilledPositionItem__infoExchangeTitle">{exchange}</p>
          </div>
        </div>
        <div className="KilledPositionItem__debtValue">
          <strong>
            {debtValueParsed}
          </strong> {baseToken.title}
        </div>
        <div className="KilledPositionItem__positionValue">
          <strong>
            {positionValueParsed}
          </strong>
          {baseToken.title}
        </div>
        <div className="KilledPositionItem__restValue">
          <strong>
            {restAmountParsed}
          </strong> {baseToken.title}
        </div>
        <div className="KilledPositionItem__txHash">
          <button 
            className="KilledPositionItem__txHashViewButton" 
            onClick={() => window.open(`https://v2.scope.klaytn.com/tx/${killedTx}`)}
          >
            Click to View
          </button>
          {/* <strong>
            {killedTx}
          </strong> */}
        </div>
      </div>
    )
  }
}

export default KilledPositionItem