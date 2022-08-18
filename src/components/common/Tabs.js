import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './Tabs.scss'

class Tabs extends Component {

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
    const { list, className } = this.props
    return (
      <div className={cx("Tabs", className)}>
        {list && list.map(({ title, isActive, onClick }) => {
          return (
            <div 
              onClick={onClick} 
              className={cx("Tabs__tab", {
                "Tabs__tab--active": isActive
              })}
            >
              {title}
            </div>
          )
        })}
      </div>
    )
  }
}

export default Tabs