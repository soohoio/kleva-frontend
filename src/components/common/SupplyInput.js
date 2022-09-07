import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { of, Subject, BehaviorSubject, merge } from 'rxjs'
import { debounceTime, takeUntil, tap } from 'rxjs/operators'

import InputWithPercentage from './InputWithPercentage'

// import { tokenList } from '../../constants/tokens'
// import { balancesInWallet$ } from '../../streams/wallet'
// import WKLAYSwitcher from './WKLAYSwitcher'

import './SupplyInput.scss'

class SupplyInput extends Component {
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
      value$,
      imgSrc,
      labelTitle,
      labelValue,
      onChange,
      inputLabel,
      priceRatio,
      valueLimit,
      decimalLimit,
      targetToken,
      headerRightContent,

      focused$,
    } = this.props

    return (
      <div className="SupplyInput">
        <div className="SuppyInput__header">
          <div className="SupplyInput__left">
            <span className="SupplyInput__labelTitle">{labelTitle}</span>
            <span className="SupplyInput__labelValue">{Number(labelValue).toLocaleString('en-us', { maximumFractionDigits: 4 })}</span>
          </div>
          {!!headerRightContent && headerRightContent}
        </div>
        <InputWithPercentage
          placeholder={"0"}
          zeroValueDisable
          focused$={focused$}
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
}

export default SupplyInput