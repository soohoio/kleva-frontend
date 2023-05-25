import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { twMerge, join } from 'tailwind-merge'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import LabelAndValue from '../LabelAndValue'
import BeforeAfter from '../BeforeAfter'
import { workerInfo$ } from '../../streams/farming'
import { noRounding } from '../../utils/misc'
import { getBufferedLeverage } from '../../utils/calc'
import { I18n } from '../common/I18n'
import Modal from '../common/Modal'

import "./ALMInfoModal.scss"

class ALMInfoModal extends Component {

  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      workerInfo$,
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

    const workerInfo = workerInfo$.value["0xb8C31Bfe3F22734CD8b92C6a943F6c7bfABBE6eb"]
    
    if (!workerInfo) return <></>

    const {
      workFactorBps,
      killFactorBps,
      killTreasuryBps,
      liquidatePrizeBps,

      membershipKillFactorBps,
      membershipWorkFactorBps,
      membershipKillTreasuryBps,
      membershipLiquidatePrizeBps,
    } = workerInfo

    const leverageCap = noRounding(getBufferedLeverage(workFactorBps), 1)
    const boostedLeverageCap = noRounding(getBufferedLeverage(membershipWorkFactorBps), 1)

    const liquidationReward = `${Number(liquidatePrizeBps / 100)}%`
    const liquidationFee = `${Number(killTreasuryBps / 100)}%`

    const liquidationThreshold = Number(killFactorBps / 100)
    const boostedLiquidationThreshold = Number(membershipKillFactorBps / 100)

    const boostedLiquidationReward = `${Number(membershipLiquidatePrizeBps / 100)}%`
    const boostedLiquidationFee = `${Number(membershipKillTreasuryBps / 100)}%`

    return (
      <Modal
        className="ALMInfoModal"
      >
        <div
          className={join(
            "flex flex-col",
          )}
        >
          <img
            className={join(
              "h-[32px]",
              "mb-[17px] mr-auto",
            )}
            src="/static/images/exported/membership-title-kr.svg" 
          />
          <p
            className={join(
              "text-[#333333]",
              "leading-[24px]",
            )}
          >
            {I18n.t('almInfoModal.description')}
          </p>
          <hr
            className={join(
              "w-[100%] h-[1px]",
              "bg-[#E6EAF2]",
              "border-none",
              "my-[25px]",
            )}
          />
          <p
            className={join(
              "text-[15px] font-normal",
              "text-[#8B96B2] mb-[15px]",
            )}
          >
            {I18n.t('almInfoModal.ex.title')}
          </p>
          <div>
            <LabelAndValue
              className="ALMInfoModal__LabelAndValue ALMInfoModal__LabelAndValue--withIcon"
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
              className="ALMInfoModal__LabelAndValue"
              label={(
                <div>
                  <p>{I18n.t('boostInfoModal.liquidationLimit')}</p>
                </div>
              )}
              value={(
                <>
                  <BeforeAfter
                    before={`${liquidationThreshold.toFixed(2)}%`}
                    after={`${boostedLiquidationThreshold.toFixed(2)}%`}
                  />
                </>
              )}
            />
            <LabelAndValue
              className="ALMInfoModal__LabelAndValue"
              label={(
                <div>
                  <p>{I18n.t('boostInfoModal.liquidationFee')}</p>
                </div>
              )}
              value={(
                <>
                  <BeforeAfter
                    before={liquidationFee}
                    after={boostedLiquidationFee}
                  />
                </>
              )}
            />
            <LabelAndValue
              className="ALMInfoModal__LabelAndValue"
              label={(
                <div>
                  <p>{I18n.t('boostInfoModal.liquidationReward')}</p>
                </div>
              )}
              value={(
                <>
                  <BeforeAfter
                    before={liquidationReward}
                    after={boostedLiquidationReward}
                  />
                </>
              )}
            />
          </div>
        </div>
      </Modal>
    )
  }
}

export default ALMInfoModal