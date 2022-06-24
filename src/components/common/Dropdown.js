import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of, fromEvent } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './Dropdown.scss'
import { BehaviorSubject } from 'rxjs';

class Dropdown extends Component {
  $container = createRef()

  destroy$ = new Subject()
  opened$ = new BehaviorSubject()
  
  componentDidMount() {
    const { selectedItem$ } = this.props
    merge(
      this.opened$,
      selectedItem$,
    ).pipe(
      debounceTime(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })

    // If clicked outer area, close dropdown
    fromEvent(window, 'click').pipe(
      takeUntil(this.destroy$)
    ).subscribe((e) => {
      if (this.isClickOuterArea(e)) {
        this.opened$.next(false)
      }
    })
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }
  
  isClickOuterArea = (e) => {
    return !this.$container.current.contains(e.target)
  }
    
  render() {
    const { items, selectedItem$, onSelect } = this.props
    return (
      <div 
        ref={this.$container} 
        onClick={() => this.opened$.next(!this.opened$.value)} 
        className="Dropdown"
      >
        <div className="Dropdown__selected">{selectedItem$.value?.title}</div>
        {this.opened$.value && (
          <div className="Dropdown__list">
            {items.map((item) => {
              return (
                <div
                  onClick={() => {
                    onSelect(item)
                  }}
                  className="Dropdown__listItem"
                >
                  {item?.title}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }
}

export default Dropdown