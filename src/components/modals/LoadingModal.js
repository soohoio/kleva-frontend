import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './LoadingModal.scss'
import Modal from '../common/Modal'
import Loading from '../common/Loading'
import { I18n } from '../common/I18n'

class LoadingModal extends Component {

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
    return (
      <Modal className="LoadingModal">
        <Loading />
        <p className="LoadingModal__description">{I18n.t('processing')}</p>
      </Modal>
    )
  }
}

export default LoadingModal