import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import "./LendStakeAPRDetailInfoModal.scss"

import Modal from '../common/Modal'
import { I18n } from '../common/I18n'
import LabelAndValue from '../LabelAndValue'
import { nFormatter } from '../../utils/misc'
import LendAndStakeControllerPopup from '../lendnstake/LendAndStakeControllerPopup'
import { openModal$ } from '../../streams/ui'

class LendStakeAPRDetailInfoModal extends Component {

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
      selectedAddress,
      ibToken,
      ibTokenPrice,
      stakingToken,
      vaultAddress,
      isDepositDisabled,
      noButton,
    } = this.props

    return (
      <Modal className="LendStakeAPRDetailInfoModal" title={title}>
        <LabelAndValue label={I18n.t('lendingAPRFull')} value={`${nFormatter(lendingAPR, 2)}%`} />
        <LabelAndValue label={I18n.t('stakingAPRFull')} value={`${nFormatter(stakingAPR, 2)}%`} />
        {!!protocolAPR && <LabelAndValue label={I18n.t('protocolAPRFull')} value={`${nFormatter(protocolAPR, 2)}%`} />}
        <hr />
        <LabelAndValue className="LendStakeAPRDetailInfoModal__apr" label={I18n.t('apr')} value={`${nFormatter(apr, 2)}%`} />
        <LabelAndValue className="LendStakeAPRDetailInfoModal__apy" label={I18n.t('apy')} value={`${nFormatter(apy, 2)}%`} />
        {!noButton && (
          <div
            className={cx("LendStakeAPRDetailInfoModal__depositButton", {
              "LendStakeAPRDetailInfoModal__depositButton--disabled": isDepositDisabled || !selectedAddress
            })}
            onClick={() => {
              if (isDepositDisabled) return
              if (!selectedAddress) return

              openModal$.next({
                classNameAttach: 'Modal--mobileCoverAll',
                component: (
                  <LendAndStakeControllerPopup
                    ibToken={ibToken}
                    ibTokenPrice={ibTokenPrice}
                    stakingToken={stakingToken}
                    vaultAddress={vaultAddress}

                    lendingAPR={lendingAPR}
                    stakingAPR={stakingAPR}
                    protocolAPR={protocolAPR}
                  />
                )
              })
            }}
          >
            {I18n.t('lend')}
          </div>
        )}
      </Modal>
    )
  }
}

export default LendStakeAPRDetailInfoModal