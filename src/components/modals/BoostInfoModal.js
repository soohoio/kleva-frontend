import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import Modal from '../common/Modal'
import { I18n } from '../common/I18n'
import LabelAndValue from '../LabelAndValue'
import BeforeAfter from '../BeforeAfter'

import "./BoostInfoModal.scss"
import { getBufferedLeverage } from '../../utils/calc'
import { noRounding } from '../../utils/misc'

class BoostInfoModal extends Component {

  destroy$ = new Subject()

  componentDidMount() {

  }

  componentWillUnmount() {
    this.destroy$.next(true)
  }

  render() {

    const { 
      workerConfig,
    } = this.props

    const {
      workFactorBps,
      killFactorBps,
      membershipKillFactorBps,
      membershipWorkFactorBps,
    } = workerConfig

    const leverageCap = noRounding(getBufferedLeverage(workFactorBps), 1)
    const boostedLeverageCap = noRounding(getBufferedLeverage(membershipWorkFactorBps), 1)

    const liquidationThreshold = Number(killFactorBps / 100)
    const boostedLiquidationThreshold = Number(membershipKillFactorBps / 100)

    return (
      <Modal 
        title="Boosted"
      >
        <p 
          className="BoostInfoModal__description"
        >
          {I18n.t('boostInfoModal.description')}
        </p>
        <div
          className="BoostInfoModal__content"
        >
          <LabelAndValue
            className="BoostInfoModal__LabelAndValue"
            label={I18n.t('boostInfoModal.maxLeverage')}
            value={(
              <>
                <BeforeAfter
                  before={`${leverageCap}${I18n.t('farming.multiplyLabel')}`}
                  after={`${boostedLeverageCap}${I18n.t('farming.multiplyLabel')}`}
                />
              </>
            )}
          />
          <LabelAndValue
            className="BoostInfoModal__LabelAndValue"
            label={(
              <div>
                <p>{I18n.t('boostInfoModal.liquidationLimit')}</p>
                <p className="BoostInfoModal__subtitle">{I18n.t('boostInfoModal.liquidationReward')}</p>
              </div>
            )}
            value={(
              <>
                <BeforeAfter
                  before={`5%`}
                  after={`3%`}
                />
              </>
            )}
          />
          <LabelAndValue
            className="BoostInfoModal__LabelAndValue"
            label={I18n.t('boostInfoModal.liquidationFee')}
            value={(
              <>
                <BeforeAfter
                  before={`${liquidationThreshold.toFixed(2)}%`}
                  after={`${boostedLiquidationThreshold.toFixed(2)}%`}
                />
              </>
            )}
          />
        </div>
        <p
          className="BoostInfoModal__description2"
        >
          {I18n.t('boostInfoModal.description2')}
        </p>
      </Modal>
    )
  }
}

export default BoostInfoModal