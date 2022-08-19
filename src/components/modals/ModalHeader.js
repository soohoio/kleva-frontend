import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './ModalHeader.scss'
import LabelAndValue from '../LabelAndValue';
import { I18n } from '../common/I18n';
import { closeContentView$, contentView$ } from '../../streams/ui'

class ModalHeader extends Component {

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
      <div className="ModalHeader">
        <p className="ModalHeader__title">
          {title}
          <img
            onClick={() => {
              closeContentView$.next(true)
            }}
            className="ModalHeader__close"
            src="/static/images/close-black.svg"
          />
        </p>
      </div>
    )
  }
}

export default ModalHeader