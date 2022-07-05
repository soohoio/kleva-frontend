import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import './Modal.scss'
import { closeLayeredModal$, closeModal$, freezeModalScroll$, layeredModalContentComponent$, unfreezeModalScroll$ } from '../../streams/ui'

function preventDefault(e) {
  e.preventDefault()
}

class Modal extends Component {
  $modalContent = createRef()

  destroy$ = new Subject()

  componentDidMount() {
  
    layeredModalContentComponent$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })

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
    const { title, className, children, mobileCoverAll } = this.props

    return (
      <div className={cx("Modal", className, {
        "Modal--mobileCoverAll": mobileCoverAll,
      })}>
        <div className={cx("Modal__header", {
          "Modal__header--noTitle": !title,
        })}>
          {!!title && <span className="Modal__title">{title}</span>}
          <img onClick={() => {
            if (layeredModalContentComponent$.value) {
              closeLayeredModal$.next(true)
              return
            }
            closeModal$.next(true)
          }} className="Modal__close" src="/static/images/close-black.svg" />
        </div>
        <div ref={this.$modalContent} className="Modal__content">
          {children}
        </div>
      </div>
    )
  }
}

export default Modal