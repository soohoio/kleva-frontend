import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import './Modal.scss'
import { closeModal$ } from '../../streams/ui'

class Modal extends Component {
  destroy$ = new Subject()

  componentDidMount() {

  }

  componentWillUnmount() {
    this.destroy$.next(true)
  }

  render() {
    const { title, className, children } = this.props

    return (
      <div className={cx("Modal", className)}>
        <div className="Modal__header">
          <span className="Modal__title">{title}</span>
          <img onClick={() => closeModal$.next(true)} className="Modal__close" src="/static/images/close-black.svg" />
        </div>
        <div className="Modal__content">
          {children}
        </div>
      </div>
    )
  }
}

export default Modal