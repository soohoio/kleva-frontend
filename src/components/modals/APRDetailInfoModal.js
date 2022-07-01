import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import "./APRDetailInfoModal.scss"

import Modal from '../common/Modal'
import { I18n } from '../common/I18n'
import LabelAndValue from '../LabelAndValue'
import { nFormatter } from '../../utils/misc'

class APRDetailInfoModal extends Component {

  destroy$ = new Subject()

  componentDidMount() {

  }

  componentWillUnmount() {
    this.destroy$.next(true)
  }

  render() {
    const { 
      title,
      lendingAPR,
      stakingAPR,
      protocolAPR,
      apr,
      apy,
    } = this.props
    return (
      <Modal className="APRDetailInfoModal" title={title}>
        <LabelAndValue label={I18n.t('lendingAPRFull')} value={`${nFormatter(lendingAPR, 2)}%`} />
        <LabelAndValue label={I18n.t('stakingAPRFull')} value={`${nFormatter(stakingAPR, 2)}%`} />
        {!!protocolAPR && <LabelAndValue label={I18n.t('protocolAPRFull')} value={`${nFormatter(protocolAPR, 2)}%`} />}
        <hr />
        <LabelAndValue className="APRDetailInfoModal__apr" label={I18n.t('apr')} value={`${nFormatter(apr, 2)}%`} />
        <LabelAndValue className="APRDetailInfoModal__apy" label={I18n.t('apy')} value={`${nFormatter(apy, 2)}%`} />
      </Modal>
    )
  }
}

export default APRDetailInfoModal