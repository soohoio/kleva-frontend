import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import Modal from '../common/Modal'
import { I18n } from '../common/I18n'

import "./LeverageInfoModal.scss"

class LeverageInfoModal extends Component {

  destroy$ = new Subject()

  componentDidMount() {

  }

  componentWillUnmount() {
    this.destroy$.next(true)
  }

  render() {
    return (
      <Modal title={I18n.t('leverage')}>
        <p className="LeverageInfoModal__description">{I18n.t('leverage.description')}</p>

        <p className="LeverageInfoModal__exampleTitle">{I18n.t('example')}</p>
        <p className="LeverageInfoModal__example">{I18n.t('leverage.example')}</p>
        <p className="LeverageInfoModal__exampleAssume">{I18n.t('leverage.example.description')}</p>
      </Modal>
    )
  }
}

export default LeverageInfoModal