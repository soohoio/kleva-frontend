import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { debounceTime, takeUntil, tap } from 'rxjs/operators'

import './AdjustPositionPopupOptionSwitcher.scss'

class AdjustPositionPopupOptionSwitcher extends Component {
  destroy$ = new Subject()

  componentDidMount() {
    const { borrowMore$ } = this.props

    merge(
      borrowMore$,
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
    const { borrowMore$, baseToken, children } = this.props

    return (
      <div className="AdjustPositionPopupOptionSwitcher">
        <div className="AdjustPositionPopupOptionSwitcher__tabs">
          <div
            className={cx("AdjustPositionPopupOptionSwitcher__AddCollateralTab", {
              "AdjustPositionPopupOptionSwitcher__AddCollateralTab--active": !borrowMore$.value,
            })}
            onClick={() => borrowMore$.next(false)}
          >
            <p className="AdjustPositionPopupOptionSwitcher__tabTitle">Adding Collateral</p>
          </div>
          <div
            onClick={() => borrowMore$.next(true)}
            className={cx("AdjustPositionPopupOptionSwitcher__BorrowMoreTab", {
              "AdjustPositionPopupOptionSwitcher__BorrowMoreTab--active": borrowMore$.value,
            })}
          >
            <p className="AdjustPositionPopupOptionSwitcher__tabTitle">Borrow More {baseToken.title}</p>
          </div>
        </div>
        <div className="AdjustPositionPopupOptionSwitcher__content">
          {children}
        </div>
      </div>
    )
  }
}

export default AdjustPositionPopupOptionSwitcher