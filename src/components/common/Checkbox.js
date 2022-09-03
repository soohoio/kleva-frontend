import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './Checkbox.scss'

class Checkbox extends Component {

  destroy$ = new Subject()
  
  componentDidMount() {
    const { checked$ } = this.props
    merge(
      checked$,
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
    const { title, checked$ } = this.props
    return (
      <div onClick={() => checked$.next(!checked$.value)} className="Checkbox">
        <img className="Checkbox__image" src={`/static/images/exported/${checked$.value ? 'checked': 'unchecked'}.svg`} />
        {title && <span className="Checkbox__title">{title}</span>}
      </div>
    )
  }
}

export default Checkbox