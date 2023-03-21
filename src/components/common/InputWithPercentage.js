import React, { Component, Fragment, createRef } from 'react'
import BigNumber from 'bignumber.js'
import cx from 'classnames'
import { Subject, merge, BehaviorSubject, fromEvent, timer } from 'rxjs'
import { debounceTime, distinctUntilChanged, take, takeUntil, tap } from 'rxjs/operators'

import Opener from 'components/common/Opener'

import { I18n } from 'components/common/I18n'

import './InputWithPercentage.scss'
import { toFixed } from '../../utils/calc'
import { tokenList } from '../../constants/tokens'
import { noRounding, replaceall } from '../../utils/misc'

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

  opened$ = new BehaviorSubject()

  state = {
    isFocused: false,
  }

  componentDidMount() {
    const { value$, focused$, valueLimit } = this.props

    merge(
      value$.pipe(
        tap((value) => {
          this.selectedItem$.next({ 
            title: `${this.calcPercentageFromValue(value)}`,
            value: value,
            key: `${this.calcPercentageFromValue(value)}`,
          })
        })
      ),
      this.selectedItem$,
      this.opened$,
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

    // auto focus (HACK for safari)
    if (this.props.autoFocus) {
      setTimeout(() => {
        if (this.$input?.current) {
          this.$input.current.focus()
          var e = new Event('touchstart')
          var e2 = new Event('touchend')
          this.$input.current.dispatchEvent(e)
          this.$input.current.dispatchEvent(e2)
          this.setState({ isFocused: true })
        }
      }, 0)
    }
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }

  calcPercentageFromValue = (val) => {
    const { valueLimit } = this.props

    val = replaceall(',', '', val)

    const percentage = new BigNumber(val).div(valueLimit).toNumber() * 100

    return (val && valueLimit != 0) 
      ? percentage > 100 
        ? "100%+"
        : `${parseInt(Math.round(percentage))}%`
      : "0%"
  }

  selectPercent = ({ value }) => {
    const { value$, valueLimit, decimalLimit } = this.props

    let newValue = this.getNewValue(value, valueLimit)

    value$.next(newValue)
  }

  getNewValue = (value, valueLimit) => {
    const { targetToken, decimalLimit = 18 } = this.props

    if (!valueLimit) return 0

    if (value === 100) {

      // @corner-case: When max button clicked with KLAY token, subtract KLAY of gas fee.
      const isTargetTokenKLAY = targetToken?.address?.toLowerCase() == tokenList.KLAY.address?.toLowerCase()
      
      if (isTargetTokenKLAY && valueLimit > 1) {
        return noRounding(new BigNumber(valueLimit).minus(1).toNumber(), 6)
      }

      // return noRounding(valueLimit, 6)
      return valueLimit
    }

    return Number(Number(valueLimit) * (value / 100)).toLocaleString('en-us', { maximumFractionDigits: 6 })
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
      targetToken,
      noWarn,
      onEnterKey,
      isProcessing,
    } = this.props

    // zeroValueDisable: If value is zero, disable
    const isZeroValue = valueLimit == 0
    const isDisabled = (zeroValueDisable && isZeroValue)

    const isInvalidValue = !isProcessing && (valueLimit && (new BigNumber(value$.value).gt(valueLimit)))

    return (
      <>
        <div 
          className={cx("InputWithPercentage", className, {
            "InputWithPercentage--focused": isFocused,
            "InputWithPercentage--disabled": isDisabled,
            "InputWithPercentage--invalid": isInvalidValue,
            "InputWithPercentage--opened": !!this.opened$.value,
            [`InputWithPercentage--${targetToken.title}`]: true,
          })}
        >
          <div className="InputWithPercentage__content">
            {!!imgSrc && <img className="InputWithPercentage__image" src={imgSrc} />}
            <input
              inputmode="decimal"
              autoFocus={autoFocus}
              ref={this.$input}
              readOnly={isDisabled}
              className="InputWithPercentage__input"
              value={value$.value}
              placeholder={placeholder || I18n.t('writeAmount')}
              onKeyDown={(e) => {
                if (!onEnterKey) return
                const key = e.key || e.keyCode
                if (key === 'Enter' || key === 13) {
                  onEnterKey()
                }
              }}
              onChange={(e) => {

                e.target.value = replaceall(',', '', e.target.value)

                if (e.target.value !== "." && isNaN(Number(e.target.value))) return

                if (e.target.value >= 10_000_000_000_000_000) return

                const splitted = String(e.target.value).split('.')
                const integerPart = splitted[0]
                const decimalPart = splitted[1]

                if (decimalPart && decimalPart.length > 18) return

                value$.next(e.target.value)

                this.selectedItem$.next({
                  title: `${this.calcPercentageFromValue(value$.value)}`,
                  value: value$.value,
                  key: `${this.calcPercentageFromValue(value$.value)}`,
                })
              }}
            />
            <div className="InputWithPercentage__right">
              <span className="InputWithPercentage__label">{label}</span>
              {!noPercentage && (
                <Opener
                  opened$={this.opened$}
                  items={percentItems}
                  selectedItem={this.selectedItem$.value}
                  onSelect={this.selectPercent}
                />
              )}
            </div>
          </div>
          {!noWarn && !!isInvalidValue && (
            <>
              <p className="InputWithPercentage__warn">{I18n.t('notEnoughAmount')}</p>
            </>
          )}
        </div>
      </>
    )
  }
}

export default InputWithPercentage