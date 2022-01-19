import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, interval, of } from 'rxjs'
import { startWith, switchMap, takeUntil, tap } from 'rxjs/operators'

import FarmSummaryItem from 'components/FarmSummaryItem'

import './ConvertToBaseTokenSummary.scss'
import { nFormatter } from '../utils/misc'
import { getOutputTokenAmount$ } from '../streams/contract'
import { BehaviorSubject } from 'rxjs'
import { lpTokenByIngredients } from '../constants/tokens'

class ConvertToBaseTokenSummary extends Component {
  destroy$ = new Subject()

  outputAmount$ = new BehaviorSubject()
  priceImpact$ = new BehaviorSubject()
  
  componentDidMount() {

    merge(
      this.outputAmount$,
      this.priceImpact$,
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })

    interval(1000 * 5).pipe(
      startWith(0),
      switchMap(() => {
        // Convert FarmingToken To BaseToken
        return getOutputTokenAmount$(
          this.props.farmingToken,
          this.props.baseToken,
          new BigNumber(this.props.userFarmingTokenAmount)
            .multipliedBy(10 ** this.props.farmingToken.decimals)
            .toFixed(0),
        )
      }),
      tap((outputAmount) => {
        this.outputAmount$.next(outputAmount && nFormatter(
          new BigNumber(outputAmount.outputAmount)
          .div(10 ** this.props.baseToken.decimals)
          .toNumber(), 
          4
        ))
        this.priceImpact$.next(outputAmount && nFormatter(outputAmount.priceImpact, 2))
      }),
      takeUntil(this.destroy$)
    ).subscribe()
  }
  
  componentWillUnmount() {
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
    const amountToTrade = nFormatter(userFarmingTokenAmount, 4)

    const feeAmount = new BigNumber(userFarmingTokenAmount)
      .multipliedBy(this.priceImpact$.value / 100)
      .toNumber()

    const convertedPositionValue = new BigNumber(userBaseTokenAmount)
      .plus(new BigNumber(this.outputAmount$.value))
      .toNumber()

    const youWillReceiveAmount = new BigNumber(convertedPositionValue)
      .minus(debtValue)
      .toNumber()

    return (
      <div className="ConvertToBaseTokenSummary">
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
          right={`${nFormatter(convertedPositionValue, 4)} ${baseToken.title}`}
        />
        <FarmSummaryItem
          left="Debt Value"
          right={`${nFormatter(debtValue, 2)} ${baseToken.title}`}
        />
        <div className="ConvertToBaseTokenSummary__line" />
        <FarmSummaryItem
          left="You'll approximately receive"
          leftSub="Minimum received"
          right={`${nFormatter(youWillReceiveAmount, 4)} ${baseToken.title}`}
        />
      </div>
    )
  }
}

export default ConvertToBaseTokenSummary