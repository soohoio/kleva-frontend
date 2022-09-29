import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './RadioSet2.scss'

const Circle = ({ active }) => {
  return (
    <img className="Circle" src={`/static/images/exported/${active ? "radio-circle-active" : "radio-circle"}.svg?date=20220929`} className={cx("Circle")} />
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
    const { className, selectedKey, onSelect, list } = this.props
    return (
      <div className={cx("RadioSet2", className)}>
        {list.map(({ label, key, labelDecorator, value, onClick }) => {
          const isActive = selectedKey == key
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