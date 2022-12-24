import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import BigNumber from 'bignumber.js'

import { I18n } from 'components/common/I18n'

import './KilledGridItem.scss'
import { nFormatter, noRounding } from '../../utils/misc'
import LabelAndValue from 'components/LabelAndValue'
import { ignorePositionMap$ } from '../../streams/farming'

import { toFixed } from '../../utils/calc'

class KilledGridItem extends Component {
  destroy$ = new Subject()

  componentDidMount() {

  }

  componentWillUnmount() {
    this.destroy$.next(true)
  }

  render() {
    const {
      killedTx,
      killFactorBps,
      positionValueAtKilled,
      debtAtKilled,
      prizeAtKilled,
      restAmountAtKilled,
      positionId,
      farmingToken,
      baseToken,
      exchange, // klayswap
      token1,
      token2,
      token3,
      token4,
      tokens,
      lpToken,
    } = this.props

    const leverage = new BigNumber(positionValueAtKilled).div(
      new BigNumber(positionValueAtKilled).minus(debtAtKilled)
    ).toNumber()

    const threshold = noRounding(Number(killFactorBps / 100), 2)

    return (
      <div className="KilledGridItem">
        <div className="KilledGridItem__asset">
          <div className="KilledGridItem__iconWrapper">
            <img className="KilledGridItem__icon" src={token1.iconSrc} />
            <img className="KilledGridItem__icon KilledGridItem__icon--baseToken" src={token2.iconSrc} />
            {token3 && <img className="KilledGridItem__icon KilledGridItem__icon--baseToken" src={token3.iconSrc} />}
            {token4 && <img className="KilledGridItem__icon KilledGridItem__icon--baseToken" src={token4.iconSrc} />}
          </div>
          <div className="KilledGridItem__titleWrapper">
            <p className="KilledGridItem__poolInfoTitle">{lpToken.title}</p>
            <p className="KilledGridItem__poolInfoExchange">{exchange} #{positionId}</p>
          </div>
        </div>
        <div className="KilledGridItem__liquidatedInfo">
          <LabelAndValue
            className="KilledGridItem__liquidated"
            label=""
            value={I18n.t('liquidated')}
          />
          <LabelAndValue
            className="KilledGridItem__leverage"
            label=""
            value={I18n.t('myasset.farming.leverageValue', { leverage: toFixed(Number(leverage), 1) })}
          />
        </div>
        <div className="KilledGridItem__values">
          <p className="KilledGridItem__marketValue">{`${nFormatter(new BigNumber(positionValueAtKilled).div(10 ** baseToken.decimals).toNumber(), 4)} ${baseToken.title}`}</p>
        </div>
        <div className="KilledGridItem__values">
          <p className="KilledGridItem__marketValue">{`${nFormatter(new BigNumber(debtAtKilled).div(10 ** baseToken.decimals).toNumber(), 4)} ${baseToken.title}`}</p>
        </div>
        <div className="KilledGridItem__values">
          <p className="KilledGridItem__withdrawnValue">{`${nFormatter(new BigNumber(restAmountAtKilled).div(10 ** baseToken.decimals).toNumber(), 4)} ${baseToken.title}`}</p>
        </div>
        <div className="KilledGridItem__buttons">
          <button
            className={cx("KilledGridItem__historyButton")}
            onClick={() => {
              window.open(`https://scope.klaytn.com/tx/${killedTx}`)
            }}
          >
            {I18n.t('transactionHistory')}
          </button>
          <button
            className="KilledGridItem__deleteButton"
            onClick={() => {
              ignorePositionMap$.next({
                ...ignorePositionMap$.value,
                [killedTx]: true,
              })
            }}
          >
            {I18n.t('deleteFromList')}
          </button>
        </div>
      </div>
    )
  }
}

export default KilledGridItem