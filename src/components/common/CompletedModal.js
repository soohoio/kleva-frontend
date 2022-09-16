import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './CompletedModal.scss'
import Modal from './Modal'

class CompletedModal extends Component {

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
    const { layered, children, menus } = this.props
    
    return (
      <Modal noAnimation layered={layered} className="CompletedModal">
        <div className="CompletedModal__content">
          {children}
        </div>
        <div className="CompletedModal__menus">
          {menus && menus.map(({ title, onClick }) => {
            return (
              <div onClick={onClick} className="CompletedModal__menuItem">{title}</div>
            )
          })}
        </div>
      </Modal>
    )
  }
}

export default CompletedModal