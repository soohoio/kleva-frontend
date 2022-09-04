import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import { I18n } from 'components/common/I18n'

import './FarmAssetCard.scss'
import { nFormatter, noRounding } from '../../utils/misc'
import LabelAndValue from 'components/LabelAndValue'

import './KilledCard.scss'
import { ignorePositionMap$ } from '../../streams/farming'

class KilledCard extends Component {

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
    } = this.props

    const leverage = new BigNumber(positionValueAtKilled).div(
      new BigNumber(positionValueAtKilled).minus(debtAtKilled)
    ).toNumber()

    const threshold = noRounding(Number(killFactorBps / 100), 2)

    return (
      <div className="KilledCard">
        <div className="KilledCard__iconWrapper">
          <img className="KilledCard__icon" src={farmingToken.iconSrc} />
          <img className="KilledCard__icon" src={baseToken.iconSrc} />
        </div>
        <div className="KilledCard__content">
          <LabelAndValue
            className="LendNStakeAssetCard__contentHeader"
            label={(
              <>
                <p className="KilledCard__poolInfoTitle">{farmingToken.title}+{baseToken.title}</p>
                <p className="KilledCard__poolInfoExchange">{exchange} #{positionId}</p>
              </>
            )}
            value={(
              <>
                <>
                  <p className="KilledCard__liquidated">{I18n.t('liquidated')}</p>
                  <p className="KilledCard__leverage">{I18n.t('myasset.farming.leverageValue', { leverage: Number(leverage).toFixed(1) })}</p>
                </>
              </>
            )}
          />
          <LabelAndValue
            className="KilledCard__marketValue"
            label={I18n.t('farming.summary.totalDeposit')}
            value={`${nFormatter(new BigNumber(positionValueAtKilled).div(10 ** baseToken.decimals).toNumber(), 4)} ${baseToken.title}`}
          />
          <LabelAndValue
            className="KilledCard__marketValue"
            label={I18n.t('myasset.farming.repaymentValue')}
            value={`${nFormatter(new BigNumber(debtAtKilled).div(10 ** baseToken.decimals).toNumber(), 4)} ${baseToken.title}`}
          />
          <LabelAndValue
            className="KilledCard__withdrawnValue"
            label={I18n.t('myasset.farming.withdrawnValue')}
            value={`${nFormatter(new BigNumber(restAmountAtKilled).div(10 ** baseToken.decimals).toNumber(), 4)} ${baseToken.title}`}
          />
          <p className="KilledCard__liquidationDescription">{I18n.t('myasset.farming.withdrawnValue.description', { threshold })}</p>
          <div className="KilledCard__buttons">
            <button
              className={cx("KilledCard__historyButton")}
              onClick={() => {
                window.open(`https://scope.klaytn.com/tx/${killedTx}`)
              }}
            >
              {I18n.t('transactionHistory')}
            </button>
            <button
              className="KilledCard__deleteButton"
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
      </div>
    )
  }
}

export default KilledCard