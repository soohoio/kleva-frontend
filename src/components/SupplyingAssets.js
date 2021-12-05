import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, BehaviorSubject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import InputWithPercentage from './common/InputWithPercentage'

import './SupplyingAssets.scss'

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
      {/* <div className="SupplyInput__priceRatioWrapper">
        <p className="SupplyInput__priceRatio">1 KLEVA = 1 KLAY</p>
      </div> */}
    </div>
  )
}

class SupplyingAssets extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    
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

    return (
      <div className="SupplyingAssets">
        <p className="SupplyingAssets__title">Supplying Assets</p>
        <SupplyInput 
          value$={farmingTokenAmount$}
          valueLimit={balances[farmingToken.address] && balances[farmingToken.address].balanceParsed}
          labelValue={balances[farmingToken.address] && balances[farmingToken.address].balanceParsed}
          imgSrc={farmingToken.iconSrc}
          labelTitle={`Available ${farmingToken.title}`}
          inputLabel={farmingToken.title}
        />
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