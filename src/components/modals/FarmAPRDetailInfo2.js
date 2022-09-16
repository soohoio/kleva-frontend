import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import "./FarmAPRDetailInfo2.scss"

import Modal from '../common/Modal'
import { I18n } from '../common/I18n'
import LabelAndValue from '../LabelAndValue'
import { nFormatter } from '../../utils/misc'
import { lendingTokenSupplyInfo$ } from '../../streams/vault'


class FarmAPRDetailInfo2 extends Component {

  destroy$ = new Subject()

  componentDidMount() {
    merge(
      lendingTokenSupplyInfo$,
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
    const {
      title,
      yieldFarmingAPR,
      klevaRewardAPR,
      tradingFeeAPR,
      borrowingInterest,
      apr,
      apy,
    } = this.props

    return (
      <Modal className="FarmAPRDetailInfo2" title={title}>
        {!!yieldFarmingAPR && (
          <LabelAndValue
            label={I18n.t('farming.yieldFarmingReward')}
            value={(
              <>
                {nFormatter(yieldFarmingAPR, 2)}%
              </>
            )}
          />
        )}
        {!!tradingFeeAPR && <LabelAndValue label={I18n.t('farming.tradingFeeAPR')} value={`${nFormatter(tradingFeeAPR, 2)}%`} />}
        <LabelAndValue label={I18n.t('farming.klevaReward')} value={`${nFormatter(klevaRewardAPR, 2)}%`} />
        <LabelAndValue className="FarmAPRDetailInfo2__borrowingInterest" label={I18n.t('farming.info.borrowingInterest')} value={`${nFormatter(borrowingInterest, 2)}%`} />
        <hr />
        <LabelAndValue className="FarmAPRDetailInfo2__apr" label={I18n.t('apr')} value={`${nFormatter(apr, 2)}%`} />
        <LabelAndValue className="FarmAPRDetailInfo2__apy" label={I18n.t('apy')} value={`${nFormatter(apy, 2)}%`} />
      </Modal>
    )
  }
}

export default FarmAPRDetailInfo2