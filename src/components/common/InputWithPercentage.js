import React, { Component, Fragment, createRef } from 'react'
import BigNumber from 'bignumber.js'
import cx from 'classnames'
import { Subject, merge, BehaviorSubject, fromEvent } from 'rxjs'
import { debounceTime, distinctUntilChanged, take, takeUntil, tap } from 'rxjs/operators'

import Opener from 'components/common/Opener'

import { I18n } from 'components/common/I18n'

import './InputWithPercentage.scss'
import { toFixed } from '../../utils/calc'
import { tokenList } from '../../constants/tokens'

const percentItems = [
  { title: "0%", value: 0, key: "0%" },
  { title: "25%", value: 25, key: "25%" },
  { title: "50%", value: 50, key: "50%" },
  { title: "75%", value: 75, key: "75%" },
  { title: "100%", value: 100, key: "100%" },
]

class InputWithPercentage extends Component {
  $input = createRef()

  destroy$ = new Subject()
  
  selectedItem$ = new BehaviorSubject()

  state = {
    isFocused: false,
  }

  componentDidMount() {
    const { value$, focused$, valueLimit } = this.props

    merge(
      value$.pipe(
        tap((value) => {
          this.selectedItem$.next({ 
            title: `${Number(this.calcPercentageFromValue(value)).toLocaleString('en-us', { maximumFractionDigits: 0 })}%`,
            value: value,
            key: `${this.calcPercentageFromValue(value)}%`,
          })
        })
      ),
      this.selectedItem$,
    ).pipe(
      debounceTime(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })

    fromEvent(this.$input.current, 'focus').pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.setState({ isFocused: true })

      if (focused$) {
        focused$.next(true)
      }
    })
    
    fromEvent(this.$input.current, 'blur').pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.setState({ isFocused: false })
      if (focused$) {
        focused$.next(false)
      }
    })

    // Initial value
    this.selectedItem$.next(percentItems[0])
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }

  calcPercentageFromValue = (val) => {
    const { valueLimit } = this.props
    return (val && valueLimit != 0) 
      ? new BigNumber(val).div(valueLimit).toNumber() * 100
      : 0
  }

  selectPercent = ({ value }) => {
    const { value$, valueLimit, decimalLimit } = this.props

    this.selectedItem$.next({
      title: `${Number(value).toLocaleString('en-us', { maximumFractionDigits: 0 })}%`,
      value: value,
      key: `${value}%`,
    })

    const newValue = this.getNewValue(value, valueLimit)

    value$.next(newValue)
  }

  getNewValue = (value, valueLimit) => {
    const { targetToken, decimalLimit = 18 } = this.props

    if (!valueLimit) return 0

    if (value === 100) {

      // @corner-case: When max button clicked with KLAY token, subtract KLAY of gas fee.
      const isTargetTokenKLAY = targetToken?.address?.toLowerCase() == tokenList.KLAY.address?.toLowerCase()
      
      if (isTargetTokenKLAY && valueLimit > 1) {
        return new BigNumber(valueLimit).minus(1).toNumber()
      }

      return valueLimit
    }

    return toFixed(Number(valueLimit) * (value / 100), decimalLimit)
  }
    
  render() {
    const { isFocused } = this.state
    const { 
      imgSrc, 
      label,
      value$,
      autoFocus,
      className,
      noPercentage,
      valueLimit,
      zeroValueDisable,
      placeholder,
    } = this.props

    // zeroValueDisable: If value is zero, disable
    const isZeroValue = valueLimit == 0
    const isDisabled = (zeroValueDisable && isZeroValue)

    const isInvalidValue = valueLimit && (new BigNumber(value$.value).gt(valueLimit))

    return (
      <>
        <div 
          className={cx("InputWithPercentage", className, {
            "InputWithPercentage--focused": isFocused,
            "InputWithPercentage--disabled": isDisabled,
            "InputWithPercentage--invalid": isInvalidValue,
          })}
        >
          {!!imgSrc && <img className="InputWithPercentage__image" src={imgSrc} />}
          <input
            autoFocus={autoFocus}
            ref={this.$input}
            readOnly={isDisabled}
            className="InputWithPercentage__input"
            value={value$.value}
            placeholder={placeholder || I18n.t('writeAmount')}
            onChange={(e) => {

              if (isNaN(Number(e.target.value))) return

              value$.next(e.target.value)

              this.selectedItem$.next({
                title: `${Number(this.calcPercentageFromValue(value$.value)).toLocaleString('en-us', { maximumFractionDigits: 0 })}%`,
                value: value$.value,
                key: `${this.calcPercentageFromValue(value$.value)}%`,
              })
            }}
          />
          <div className="InputWithPercentage__right">
            <span className="InputWithPercentage__label">{label}</span>
            {!noPercentage && (
              <Opener
                items={percentItems}
                selectedItem={this.selectedItem$.value}
                onSelect={this.selectPercent}
              />
            )}
          </div>
        </div>
        {!!isInvalidValue && <p className="InputWithPercentage__warn">{I18n.t('notEnoughAmount')}</p>}
      </>
    )
  }
}

export default InputWithPercentage