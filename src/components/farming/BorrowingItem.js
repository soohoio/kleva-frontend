import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './BorrowingItem.scss'
import { I18n } from '../common/I18n'

class BorrowingItem extends Component {

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
    const { active, onClick, label, value } = this.props

    return (
      <div 
        onClick={onClick} 
        className={cx("BorrowingItem", {
          "BorrowingItem--active": active,
        })}
      >
        <div className="BorrowingItem__title">{label}</div>
        <div className="BorrowingItem__value">
          <span className="BorrowingItem__interestRateTitle">{I18n.t('interest')}</span>
          <span className="BorrowingItem__interestRateValue">{value}</span>
        </div>
      </div>
    )
  }
}

export default BorrowingItem