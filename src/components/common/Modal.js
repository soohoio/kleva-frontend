import React, { Component, Fragment, createRef } from 'react'
import { join } from 'tailwind-merge'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { debounceTime, filter, takeUntil, tap } from 'rxjs/operators'

import './Modal.scss'
import { classNameAttach$, classNameAttachLayered$, closeLayeredModal$, closeModal$, freezeModalScroll$, layeredModalContentComponent$, modalAnimation$, unfreezeModalScroll$ } from '../../streams/ui'
import { I18n } from './I18n'

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

    merge(
      modalAnimation$.pipe(
        debounceTime(1),
      ),
      classNameAttach$,
      classNameAttachLayered$,
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })
  }

  componentWillUnmount() {
    this.destroy$.next(true)
  }

  render() {
    const { title, className, noAnimation, children, mobileCoverAll, onClose, layered, noClose } = this.props


    return (
      <div className={cx("Modal", 
        className, 
        layered 
          ? classNameAttachLayered$.value 
          : classNameAttach$.value, 
        {
          "Modal--mobileCoverAll": !!mobileCoverAll,
          [`Modal--animation-${modalAnimation$.value}`]: !noAnimation && true,
        })}
      >
        <div ref={this.$modalContent} className="Modal__content">
          <div className={cx("Modal__header", {
            "Modal__header--noTitle": !title,
          })}>
            {!!title && <span className="Modal__title">{title}</span>}
            {!noClose && (
              <img onClick={() => {
  
                if (typeof onClose === 'function') {
                  onClose()
                  return
                }
  
                if (layeredModalContentComponent$.value) {
                  closeLayeredModal$.next(true)
                  return
                }
                closeModal$.next(true)
              }} className="Modal__close" src="/static/images/exported/x.svg?date=20220929" />
            )}
          </div>
          {children}
        </div>
        {layeredModalContentComponent$.value && !layered && (
          <div
            onClick={() => closeModal$.next(true)}
            className="Modal__dim"
          />
        )}
      </div>
    )
  }
}

export default Modal