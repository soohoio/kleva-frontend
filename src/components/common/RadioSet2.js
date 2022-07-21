import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './RadioSet2.scss'

const Circle = ({ active }) => {
  return (
    <div className={cx("Circle")}>
      {active && (
        <div className="Circle__mini" />
      )}
    </div>
  )
}

class RadioSet2 extends Component {

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
    const { selectedLabel, onSelect, list } = this.props
    return (
      <div className="RadioSet2">
        {list.map(({ label, labelDecorator, value, onClick }) => {
          const isActive = selectedLabel == label
          return (
            <div 
              key={label} 
              className={cx("RadioSet2__item", {
                "RadioSet2__item--active": isActive,
              })}
              onClick={() => {
                onClick()
              }}
            >
              <div className="RadioSet2__left">
                <Circle active={isActive} />
                <span className="RadioSet2__label">
                  {label} {labelDecorator}
                </span>
              </div>
              <span className="RadioSet2__value">{value}</span>
            </div>
          )
        })}
      </div>
    )
  }
}

export default RadioSet2