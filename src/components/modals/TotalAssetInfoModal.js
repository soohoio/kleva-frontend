import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import Modal from '../common/Modal'
import { I18n } from '../common/I18n'

import "./TotalAssetInfoModal.scss"

class TotalAssetInfoModal extends Component {

  destroy$ = new Subject()

  componentDidMount() {

  }

  componentWillUnmount() {
    this.destroy$.next(true)
  }

  render() {
    return (
      <Modal title={I18n.t('myasset.farming.totalValue')}>
        <p className="TotalAssetInfoModal__description">{I18n.t('farming.totalAsset.description')}</p>

        <p className="TotalAssetInfoModal__exampleTitle">{I18n.t('farming.totalAsset.example')}</p>
      </Modal>
    )
  }
}

export default TotalAssetInfoModal