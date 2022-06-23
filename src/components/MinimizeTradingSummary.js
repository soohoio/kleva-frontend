import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { BehaviorSubject, Subject, merge, interval, of } from 'rxjs'
import { debounceTime, startWith, switchMap, takeUntil, tap } from 'rxjs/operators'

import FarmSummaryItem from 'components/FarmSummaryItem'

import { calcInputAmountBasedOnOutputAmount$, getOutputTokenAmount$ } from '../streams/contract'
import { nFormatter } from '../utils/misc'

import './MinimizeTradingSummary.scss'

class MinimizeTradingSummary extends Component {
  destroy$ = new Subject()

  outputAmount$ = new BehaviorSubject()
  priceImpact$ = new BehaviorSubject()
  amountToTrade$ = new BehaviorSubject()
  
  componentDidMount() {

    const { listenedAmountToTrade$ } = this.props

    merge(
      this.outputAmount$,
      this.priceImpact$,
      this.amountToTrade$,
    ).pipe(
      debounceTime(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })

    interval(1000 * 5).pipe(
      startWith(0),
      switchMap(() => {
        const { debtValue, userFarmingTokenAmount, userBaseTokenAmount } = this.props

        const debtMinusBaseToken = new BigNumber(debtValue)
          .minus(userBaseTokenAmount)
          .toNumber()

        if (debtMinusBaseToken < 0) {
          this.amountToTrade$.next(0)
          listenedAmountToTrade$.next(0)
          this.priceImpact$.next(0)
          return of(false)
        }

        // * Convert BaseToken To FarmingToken first, to get `amountToTrade`
        return calcInputAmountBasedOnOutputAmount$(
          this.props.farmingToken,
          this.props.baseToken,
          new BigNumber(debtMinusBaseToken)
            .multipliedBy(10 ** this.props.baseToken.decimals)
            .toFixed(0),
        )
      }),
      tap((outputAmount) => {
        if (!outputAmount) return

        this.amountToTrade$.next(outputAmount && new BigNumber(outputAmount.outputAmount)
          .div(10 ** this.props.farmingToken.decimals)
          .toNumber())

        listenedAmountToTrade$.next(new BigNumber(outputAmount.outputAmount).toFixed())

        this.priceImpact$.next(outputAmount && nFormatter(outputAmount.priceImpact, 4))
      }),
      takeUntil(this.destroy$)
    ).subscribe()
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }
    
  render() {
    const {
      isBaseTokenKLAY,
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
      .multipliedBy(this.priceImpact$.value)
      .toNumber()

    const youWillReceiveFarmingTokenAmount = new BigNumber(userFarmingTokenAmount)
      .minus(amountToTrade)
      .toNumber()
    
    const youWillReceiveBaseTokenAmount = new BigNumber(debtValue).gte(userBaseTokenAmount) 
      ? 0 
      : new BigNumber(userBaseTokenAmount).minus(debtValue).toNumber()

    const baseTokenTitle = isBaseTokenKLAY 
      ? "WKLAY"
      : baseToken.title

    return (
      <div className="MinimizeTradingSummary">
        <FarmSummaryItem
          left="Position Value Assets"
          leftSub={`1 ${farmingToken.title} = $${nFormatter(farmingTokenPrice, 2)} | 1 ${baseTokenTitle} = $${nFormatter(baseTokenPrice, 2)}`}
          right={`${nFormatter(userFarmingTokenAmount, 4)} ${farmingToken.title} + ${nFormatter(userBaseTokenAmount, 4)} ${baseTokenTitle}`}
        />
        <FarmSummaryItem
          left="Amount to Trade"
          right={`${amountToTrade} ${farmingToken.title}`}
        />
        <FarmSummaryItem
          left="Price Impact"
          leftSub="Price Impact calculated based on our equity value"
          right={`${nFormatter(feeAmount, 4)} ${farmingToken.title}`}
          rightSub={`${new BigNumber(this.priceImpact$.value).multipliedBy(100).toString() || 0}%`}
        />
        <FarmSummaryItem
          left="Debt Value"
          right={`${nFormatter(debtValue, 2)} ${baseTokenTitle}`}
        />
        <div className="ConvertToBaseTokenSummary__line" />
        <FarmSummaryItem
          left="You'll approximately receive"
          leftSub=""
          right={`${nFormatter(youWillReceiveFarmingTokenAmount, 4)} ${farmingToken.title} + ${nFormatter(youWillReceiveBaseTokenAmount, 4)} ${baseTokenTitle}`}
        />
      </div>
    )
  }
}

export default MinimizeTradingSummary