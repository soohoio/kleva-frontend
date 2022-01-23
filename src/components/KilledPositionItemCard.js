import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'

import BigNumber from 'bignumber.js'

import './KilledPositionItemCard.scss'
import LabelAndValue from './LabelAndValue'

class KilledPositionItemCard extends Component {
  destroy$ = new Subject()

  componentDidMount() {

  }

  componentWillUnmount() {
    this.destroy$.next(true)
  }

  render() {
    const {
      positionId,
      farmingToken,
      baseToken,
      exchange, // klayswap
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
      <div className="KilledPositionItemCard">
        <div className="KilledPositionItemCard__header">
          <div className="KilledPositionItemCard__headerLeft">
            <div className="KilledPositionItemCard__infoIconList">
              <img className="KilledPositionItemCard__infoIcon" src={farmingToken.iconSrc} />
              <img className="KilledPositionItemCard__infoIcon" src={baseToken.iconSrc} />
            </div>
            <div className="KilledPositionItemCard__poolInfo">
              <p className="KilledPositionItemCard__pollInfoTitle">{farmingToken.title}-{baseToken.title}</p>
              <p className="KilledPositionItemCard__poolInfoExchange">{exchange} #{positionId}</p>
            </div>
          </div>
        </div>
        <div className="KilledPositionItemCard__content">
          <LabelAndValue
            label="Debt Size at Liquidation"
            value={`${debtValueParsed} ${baseToken.title}`}
          />
          <LabelAndValue
            label="Position Size at Liquidation"
            value={`${positionValueParsed} ${baseToken.title}`}
          />
          <LabelAndValue label="Returned Amount" value={`${restAmountParsed} ${baseToken.title}`} />
          <LabelAndValue
            label="Tx Record"
            value={(
              <button
                className="KilledPositionItemCard__txHashViewButton"
                onClick={() => window.open(`https://v2.scope.klaytn.com/tx/${killedTx}`)}
              >
                View
              </button>
            )}
          />
        </div>
      </div>
    )
  }
}

export default KilledPositionItemCard