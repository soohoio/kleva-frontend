import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './AreYouSureFarming.scss'
import Modal from './Modal'
import { closeLayeredModal$, closeModal$ } from '../../streams/ui'

class AreYouSureFarming extends Component {

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
    const { theme, onClick, onCancel, message, proceedButtonTitle } = this.props
    
    return (
      <Modal
        title="Risk of Using Leverage Farming"
        className="AreYouSureFarming"
      >
        <p className="AreYouSureFarming__message">
          {message}
        </p>
        <div className="AreYouSureFarming__buttons">
          <div onClick={onCancel} className="AreYouSureFarming__cancel">Cancel & Review</div>
          <div 
            onClick={() => {
              onClick()
              closeLayeredModal$.next(true)
            }} 
            className={cx("AreYouSureFarming__proceed", {
              [`AreYouSureFarming__proceed--${theme}`]: true
            })}
          >
            {proceedButtonTitle}
          </div>
        </div>
      </Modal>
    )
  }
}

export default AreYouSureFarming