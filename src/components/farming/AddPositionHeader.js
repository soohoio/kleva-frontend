import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './AddPositionHeader.scss'
import LabelAndValue from '../LabelAndValue';
import { I18n } from '../common/I18n';
import { closeContentView$, contentView$ } from '../../streams/ui'

class AddPositionHeader extends Component {

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
    const { title } = this.props
    return (
      <div className="AddPositionHeader">
        <p className="AddPositionHeader__title">
          {title}
          <img
            onClick={() => {
              closeContentView$.next(true)
            }}
            className="AddPositionHeader__close" 
            src="/static/images/close-black.svg?date=20220929" 
          />
        </p>
      </div>
    )
  }
}

export default AddPositionHeader