import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of, fromEvent } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './Dropdown.scss'
import { BehaviorSubject } from 'rxjs';
import { I18n } from './I18n'

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
    const { items, selectedItem$, onSelect, className } = this.props

    return (
      <div 
        ref={this.$container} 
        onClick={() => this.opened$.next(!this.opened$.value)} 
        className={cx("Dropdown", className, {
          "Dropdown--opened": !!this.opened$.value,
          [`${className}--opened`]: !!this.opened$.value,
        })}
      >
        <div className="Dropdown__selected">
          {selectedItem$.value?.i18nkey 
            ? I18n.t(selectedItem$.value.i18nkey)
            : selectedItem$.value?.title}
          </div>
        {this.opened$.value && (
          <div className="Dropdown__list">
            {items.map((item) => {
              return (
                <div
                  onClick={() => {
                    onSelect(item)
                  }}
                  className={cx("Dropdown__listItem", {
                    "Dropdown__listItem--selected": selectedItem$.value?.value == item.value,
                  })}
                >
                  {item?.i18nkey 
                    ? I18n.t(item.i18nkey)
                    : item?.title
                  }
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