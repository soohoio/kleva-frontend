import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './Guide.scss'

class Guide extends Component {

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
    const { title, description, buttonTitle, buttons, onClick } = this.props
    
    return (
      <div className="Guide">
        <p className="Guide__title">{title}</p>
        {!!description && <p className="Guide__description">{description}</p>}
        {buttons && buttons.length != 0
          ? (
            <div className="Guide__buttons">
              {buttons.map(({ title, onClick }) => {
                return (
                  <button onClick={onClick} className="Guide__button">{title}</button>
                )
              })}
            </div>
          )
          : <button onClick={onClick} className="Guide__button">{buttonTitle}</button>
        }
      </div>
    )
  }
}

export default Guide