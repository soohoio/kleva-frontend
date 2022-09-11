import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import Modal from '../common/Modal'
import { I18n } from '../common/I18n'

import "./LockupInfoModal.scss"

class LockupInfoModal extends Component {

  destroy$ = new Subject()

  componentDidMount() {

  }

  componentWillUnmount() {
    this.destroy$.next(true)
  }

  render() {
    return (
      <Modal title={I18n.t('dashboard.lockup.modal.title')}>
        <p className="LockupInfoModal__description">{I18n.t('dashboard.lockup.modal.description')}</p>
      </Modal>
    )
  }
}

export default LockupInfoModal