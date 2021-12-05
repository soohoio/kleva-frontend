import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, BehaviorSubject } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import Dropdown from 'components/common/Dropdown'

import './InputWithPercentage.scss'

const percentItems = [
  { title: "0%", value: 0, key: "0%" },
  { title: "25%", value: 25, key: "25%" },
  { title: "50%", value: 50, key: "50%" },
  { title: "75%", value: 75, key: "75%" },
  { title: "100%", value: 100, key: "100%" },
]

class InputWithPercentage extends Component {
  destroy$ = new Subject()
  
  selectedItem$ = new BehaviorSubject()

  componentDidMount() {
    const { value$, valueLimit } = this.props

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
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })

    // Initial value
    this.selectedItem$.next(percentItems[0])
  }
  
  componentWillUnMount() {
    this.destroy$.next(true)
  }

  calcPercentageFromValue = (val) => {
    const { valueLimit } = this.props
    return (val && valueLimit) 
      ? (val / valueLimit) * 100
      : 0
  }

  selectPercent = ({ value }) => {
    const { value$, valueLimit } = this.props

    this.selectedItem$.next({
      title: `${Number(value).toLocaleString('en-us', { maximumFractionDigits: 0 })}%`,
      value: value,
      key: `${value}%`,
    })

    const newValue = valueLimit 
      ? Number(valueLimit) * (value / 100)
      : 0
    
    value$.next(newValue)
  }
    
  render() {
    const { 
      imgSrc, 
      label,
      value$,
    } = this.props

    return (
      <div className="InputWithPercentage">
        <img className="InputWithPercentage__image" src={imgSrc} />
        <input
          className="InputWithPercentage__input"
          value={value$.value}
          placeholder="0"
          onChange={(e) => {
            value$.next(e.target.value)
          }}
        />
        <span className="InputWithPercentage__label">{label}</span>
        <Dropdown
          items={percentItems}
          selectedItem={this.selectedItem$.value}
          onSelect={this.selectPercent}
        />
      </div>
    )
  }
}

export default InputWithPercentage