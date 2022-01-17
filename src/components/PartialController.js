import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import './PartialController.scss'
import CommonGauge from './CommonGauge'
import { nFormatter } from '../utils/misc'

class PartialController extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }
    
  render() {
    const { 
      farmingToken,
      baseToken,
      userFarmingTokenAmount,
      userBaseTokenAmount,
      partialCloseRatio$,
      repayDebtRatio$,
      debtValue,
    } = this.props

    const farmingTokenCloseAmount = new BigNumber(userFarmingTokenAmount)
      .multipliedBy(partialCloseRatio$.value)
      .div(100)
      .toNumber()
    
    const baseTokenCloseAmount = new BigNumber(userBaseTokenAmount)
      .multipliedBy(partialCloseRatio$.value)
      .div(100)
      .toNumber()

    const debtAmountToRepay = new BigNumber(baseTokenCloseAmount)
      .multipliedBy(2)
      .multipliedBy(repayDebtRatio$.value)
      .div(100)
      .toNumber()

    const debtRepayPercentageLimit = new BigNumber(debtValue)
      .div(new BigNumber(baseTokenCloseAmount).multipliedBy(2))
      .multipliedBy(100)
      .toNumber()
    
    return (
      <div className="PartialController">
        <CommonGauge
          percentage$={partialCloseRatio$}
          title="Partial Position Value to Close"
          description="Withdraw Collateral"
          offset={25}
        />
        <div className="PartialController__gaugeSummary">
          <strong>{nFormatter(farmingTokenCloseAmount, 4)}</strong>
          {farmingToken.title} 
          <span className="PartialController__plus">+</span>
          <strong>{nFormatter(baseTokenCloseAmount, 4)}</strong>
          {baseToken.title}
        </div>
        <CommonGauge
          percentage$={repayDebtRatio$}
          title="Amount of Debt to Repay"
          offset={25}
          limit={debtRepayPercentageLimit}
        />
        <div className="PartialController__gaugeSummary">
          <strong>{nFormatter(debtAmountToRepay, 4)}</strong>
          <span>{baseToken.title}</span>
        </div>
      </div>
    )
  }
}

export default PartialController