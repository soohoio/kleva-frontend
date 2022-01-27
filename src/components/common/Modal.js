import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import './Modal.scss'
import { closeModal$, freezeModalScroll$, unfreezeModalScroll$ } from '../../streams/ui'

function preventDefault(e) {
  e.preventDefault()
}

class Modal extends Component {
  $modalContent = createRef()

  destroy$ = new Subject()

  componentDidMount() {
  
    freezeModalScroll$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      if (!this.$modalContent.current) return
      this.$modalContent.current.addEventListener('touchmove', preventDefault, { passive: false }) // mobile
    })
    
    unfreezeModalScroll$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      if (!this.$modalContent.current) return
      this.$modalContent.current.removeEventListener('touchmove', preventDefault, { passive: false })
    })
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
        <div ref={this.$modalContent} className="Modal__content">
          {children}
        </div>
      </div>
    )
  }
}

export default Modal