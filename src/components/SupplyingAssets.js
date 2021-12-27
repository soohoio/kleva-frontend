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
}) => {

  return (
    <div className="SupplyInput">
      <div className="SuppyInput__header">
        <span className="SupplyInput__labelTitle">{labelTitle}</span>
        <span className="SupplyInput__labelValue">{Number(labelValue).toLocaleString('en-us', { maximumFractionDigits: 4 })}</span>
      </div>
      <InputWithPercentage
        imgSrc={imgSrc}
        value$={value$}
        label={inputLabel}
        valueLimit={valueLimit}
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
  
  componentWillUnMount() {
    this.destroy$.next(true)
  }
    
  render() {
    const { 
      farmingToken, 
      baseToken, 
      balances,
      farmingTokenAmount$,
      baseTokenAmount$,
    } = this.props

    const isFarmingTokenKLAY = farmingToken && farmingToken.address === tokenList.KLAY.address

    return (
      <div className="SupplyingAssets">
        <p className="SupplyingAssets__title">Supplying Assets</p>
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
              value$={farmingTokenAmount$}
              valueLimit={balances[farmingToken.address] && balances[farmingToken.address].balanceParsed}
              labelValue={balances[farmingToken.address] && balances[farmingToken.address].balanceParsed}
              imgSrc={farmingToken.iconSrc}
              labelTitle={`Available ${farmingToken.title}`}
              inputLabel={farmingToken.title}
            />
          )
        }
        <SupplyInput 
          value$={baseTokenAmount$}
          valueLimit={balances[baseToken.address] && balances[baseToken.address].balanceParsed}
          labelValue={balances[baseToken.address] && balances[baseToken.address].balanceParsed}
          imgSrc={baseToken.iconSrc}
          labelTitle={`Available ${baseToken.title}`}
          inputLabel={baseToken.title}
        />
      </div>
    )
  }
}

export default SupplyingAssets