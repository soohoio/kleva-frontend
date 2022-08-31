import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import './PartialController.scss'
import CommonGauge from './CommonGauge'
import { nFormatter } from '../utils/misc'
import { I18n } from './common/I18n'

class PartialController extends Component {
  destroy$ = new Subject()

  componentDidMount() {
    const { debtRepaymentAmount$ } = this.props
    merge(
      debtRepaymentAmount$,
    ).pipe(
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
      farmingToken,
      baseToken,
      partialCloseRatio$,
      repayDebtRatio$,
      userFarmingTokenAmount,
      userBaseTokenAmount,
      debtRepaymentAmount$,
      repayPercentageLimit,
      isBaseTokenKLAY,

      minPartialCloseRatio$,
      maxPartialCloseRatio$,
      minRepaymentDebtRatio$,
      maxRepaymentDebtRatio$,
    } = this.props

    console.log(minPartialCloseRatio$.value, 'minPartialCloseRatio$.value')
    console.log(maxPartialCloseRatio$.value, 'maxPartialCloseRatio$.value')
    console.log(minRepaymentDebtRatio$.value, 'minRepaymentDebtRatio$.value')
    console.log(maxRepaymentDebtRatio$.value, 'maxRepaymentDebtRatio$.value')

    const baseTokenTitle = isBaseTokenKLAY
      ? "WKLAY"
      : baseToken.title

    const farmingTokenCloseAmount = new BigNumber(userFarmingTokenAmount)
      .multipliedBy(partialCloseRatio$.value)
      .div(100)
      .toNumber()

    const baseTokenCloseAmount = new BigNumber(userBaseTokenAmount)
      .multipliedBy(partialCloseRatio$.value)
      .div(100)
      .toNumber()

    const debtRepaymentAmount = new BigNumber(debtRepaymentAmount$.value).div(10 ** baseToken.decimals).toNumber()

    return (
      <div className="PartialController">
        <CommonGauge

          min={minPartialCloseRatio$.value}
          max={maxPartialCloseRatio$.value}

          percentage$={partialCloseRatio$}
          title={I18n.t('withdrawAsset')}
          description={(
            <>
              <p>
                <strong>{nFormatter(farmingTokenCloseAmount, 4)}</strong> <span>{farmingToken.title}</span>
              </p>
              <p>
                <strong>{nFormatter(baseTokenCloseAmount, 4)}</strong> <span>{baseTokenTitle}</span>
              </p>
            </>
          )}
          offset={25}
        />
        <div className="PartialController__gaugeSummary">
          <strong>{nFormatter(farmingTokenCloseAmount, 4)}</strong>
          {farmingToken.title}
          <span className="PartialController__plus">+</span>
          <strong>{nFormatter(baseTokenCloseAmount, 4)}</strong>
          {baseTokenTitle}
        </div>
        <CommonGauge
          min={minRepaymentDebtRatio$.value}
          max={maxRepaymentDebtRatio$.value}

          percentage$={repayDebtRatio$}
          title={I18n.t('farming.closePosition.debtRepayment')}
          description={(
            <>
              <strong>{nFormatter(debtRepaymentAmount, 4)}</strong>
              <span>{baseTokenTitle}</span>
            </>
          )}
          offset={25}
          limit={repayPercentageLimit}
        />
      </div>
    )
  }
}

export default PartialController