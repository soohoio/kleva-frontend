import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, BehaviorSubject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import InputWithPercentage from './common/InputWithPercentage'

import './SupplyingAssets.scss'
import { tokenList } from '../constants/tokens'
import { balancesInWallet$ } from '../streams/wallet'
import WKLAYSwitcher from './WKLAYSwitcher'

const SupplyInput = ({ 
  value$,
  imgSrc,
  labelTitle, 
  labelValue, 
  onChange,
  inputLabel,
  priceRatio,
  valueLimit,
  decimalLimit,
  targetToken
}) => {

  return (
    <div className="SupplyInput">
      <div className="SuppyInput__header">
        <span className="SupplyInput__labelTitle">{labelTitle}</span>
        <span className="SupplyInput__labelValue">{Number(labelValue).toLocaleString('en-us', { maximumFractionDigits: 4 })}</span>
      </div>
      <InputWithPercentage
        decimalLimit={decimalLimit}
        imgSrc={imgSrc}
        value$={value$}
        label={inputLabel}
        valueLimit={valueLimit}
        targetToken={targetToken}
      />
    </div>
  )
}

class SupplyingAssets extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      balancesInWallet$,
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
      title,
      farmingToken, 
      baseToken, 
      balances,
      farmingTokenAmount$,
      baseTokenAmount$,
    } = this.props

    const isFarmingTokenKLAY = farmingToken && farmingToken.address === tokenList.KLAY.address

    return (
      <div className="SupplyingAssets">
        <p className="SupplyingAssets__title">{title || "Supplying Assets"}</p>
        {isFarmingTokenKLAY 
          ? (
            <WKLAYSwitcher
              balancesInWallet={balancesInWallet$.value}

              value$={farmingTokenAmount$}
              valueLimit={balances[farmingToken.address] && balances[farmingToken.address].balanceParsed}
              labelValue={balances[farmingToken.address] && balances[farmingToken.address].balanceParsed}
              imgSrc={farmingToken.iconSrc}
              labelTitle={`Available ${farmingToken.title}`}
              inputLabel={farmingToken.title}
            />
          )
          : (
            <SupplyInput
              decimalLimit={farmingToken.decimals}
              value$={farmingTokenAmount$}
              valueLimit={balances[farmingToken.address] && balances[farmingToken.address].balanceParsed}
              labelValue={balances[farmingToken.address] && balances[farmingToken.address].balanceParsed}
              imgSrc={farmingToken.iconSrc}
              labelTitle={`Available ${farmingToken.title}`}
              inputLabel={farmingToken.title}
              targetToken={farmingToken}
            />
          )
        }
        <SupplyInput 
          decimalLimit={baseToken.decimals}
          value$={baseTokenAmount$}
          valueLimit={balances[baseToken.address] && balances[baseToken.address].balanceParsed}
          labelValue={balances[baseToken.address] && balances[baseToken.address].balanceParsed}
          imgSrc={baseToken.iconSrc}
          labelTitle={`Available ${baseToken.title}`}
          inputLabel={baseToken.title}
          targetToken={baseToken}
        />
      </div>
    )
  }
}

export default SupplyingAssets