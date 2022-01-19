import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import './RadioSet.scss'

class RadioSet extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }
    
  render() {
    const { selectedValue, list, setChange, className } = this.props
    
    return (
      <div className={cx("RadioSet", className)}>
        {list && list.map(({ title, value }) => {
          return (
            <div 
              className={cx("RadioSet__item", {
                "RadioSet__item--selected": selectedValue === value,
              })} 
              onClick={() => setChange(value)}
            >
              {title}
            </div>
          )
        })}
      </div>
    )
  }
}

export default RadioSet