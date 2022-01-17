import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { BehaviorSubject, Subject, merge, interval, of } from 'rxjs'
import { startWith, switchMap, takeUntil, tap } from 'rxjs/operators'

import FarmSummaryItem from 'components/FarmSummaryItem'

import { getOutputTokenAmount$ } from '../streams/contract'
import { nFormatter } from '../utils/misc'

import './MinimizeTradingSummary.scss'

class MinimizeTradingSummary extends Component {
  destroy$ = new Subject()

  outputAmount$ = new BehaviorSubject()
  priceImpact$ = new BehaviorSubject()
  amountToTrade$ = new BehaviorSubject()
  
  componentDidMount() {
    merge(
      this.outputAmount$,
      this.priceImpact$,
      this.amountToTrade$,
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })

    interval(1000 * 5).pipe(
      startWith(0),
      switchMap(() => {
        const { debtValue, userFarmingTokenAmount, userBaseTokenAmount } = this.props

        const baseTokenMinusDebt = new BigNumber(userBaseTokenAmount)
          .minus(debtValue)
          .toNumber()

        if (baseTokenMinusDebt > 0) {
          this.amountToTrade$.next(0)
          this.priceImpact$.next(0)
          return of(false)
        }

        // * Convert BaseToken To FarmingToken first, to get `amountToTrade`
        return getOutputTokenAmount$(
          this.props.baseToken,
          this.props.farmingToken,
          new BigNumber(baseTokenMinusDebt)
            .multipliedBy(10 ** this.props.baseToken.decimals)
            .toFixed(0),
        )
      }),
      tap((outputAmount) => {
        if (!outputAmount) return

        this.amountToTrade$.next(outputAmount && nFormatter(
          new BigNumber(outputAmount.outputAmount)
            .div(10 ** this.props.farmingToken.decimals)
            .toNumber(),
          4
        ))

        this.priceImpact$.next(outputAmount && nFormatter(outputAmount.priceImpact, 2))
      }),
      takeUntil(this.destroy$)
    ).subscribe()
  }
  
  componentWillUnMount() {
    this.destroy$.next(true)
  }
    
  render() {
    const {
      farmingToken,
      baseToken,
      tokenPrices,
      debtValue,
      userFarmingTokenAmount,
      userBaseTokenAmount,
    } = this.props

    const farmingTokenPrice = tokenPrices && tokenPrices[farmingToken.address.toLowerCase()]
    const baseTokenPrice = tokenPrices && tokenPrices[baseToken.address.toLowerCase()]
    const amountToTrade = this.amountToTrade$.value

    const feeAmount = new BigNumber(userFarmingTokenAmount)
      .multipliedBy(this.priceImpact$.value / 100)
      .toNumber()

    const youWillReceiveFarmingTokenAmount = new BigNumber(userFarmingTokenAmount)
      .minus(amountToTrade)
      .toNumber()
    
    const youWillReceiveBaseTokenAmount = new BigNumber(userBaseTokenAmount)
      .minus(debtValue)
      .toNumber()
    
    return (
      <div className="MinimizeTradingSummary">
        <FarmSummaryItem
          left="Position Value Assets"
          leftSub={`1 ${farmingToken.title} = $${nFormatter(farmingTokenPrice, 2)} | 1 ${baseToken.title} = $${nFormatter(baseTokenPrice, 2)}`}
          right={`${nFormatter(userFarmingTokenAmount, 4)} ${farmingToken.title} + ${nFormatter(userBaseTokenAmount, 4)} ${baseToken.title}`}
        />
        <FarmSummaryItem
          left="Amount to Trade"
          right={`${amountToTrade} ${farmingToken.title}`}
        />
        <FarmSummaryItem
          left="Price Impact & Trading Fees"
          leftSub="Percent Impact calculated based on our equity value"
          right={`${nFormatter(feeAmount, 4)} ${farmingToken.title}`}
          rightSub={`${this.priceImpact$.value}%`}
        />
        <FarmSummaryItem
          left="Converted Position Value Assets"
          right={`${nFormatter(userFarmingTokenAmount, 4)} ${farmingToken.title} + ${nFormatter(userBaseTokenAmount, 4)} ${baseToken.title}`}
        />
        <FarmSummaryItem
          left="Debt Value"
          right={`${nFormatter(debtValue, 2)} ${baseToken.title}`}
        />
        <div className="ConvertToBaseTokenSummary__line" />
        <FarmSummaryItem
          left="You'll approximately receive"
          leftSub="Minimum received"
          right={`${nFormatter(youWillReceiveFarmingTokenAmount, 4)} ${farmingToken.title} + ${nFormatter(youWillReceiveBaseTokenAmount, 4)} ${baseToken.title}`}
        />
      </div>
    )
  }
}

export default MinimizeTradingSummary