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

import "./ALMInfoModal2.scss"

class ALMInfoModal2 extends Component {

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
        title={`KLEVA ${I18n.t('membership')}`}
        className={join(
          "ALMInfoModal2",
          "dt:px-[30px]",
        )}
      >
        <div
          className={join(
            "flex flex-col",
          )}
        >
          <p 
            className={join(
              "font-[700] text-[#222222] text-[17px] leading-[18px]",
              "mb-[12px]",
            )}
          >
            {I18n.t('condition')}
          </p>
          <p
            className={join(
              "font-[600] text-[16px] text-[#636878]",
              "leading-[24px]",
            )}
          >
            {I18n.t('almInfoModal2.description')}
          </p>
          <hr
            className={join(
              "w-[100%] h-[1px]",
              "bg-[#E6EAF2]",
              "border-none",
              "my-[22px]",
            )}
          />
          <p
            className={join(
              "text-[#222222] text-[17px] font-[700]",
              "leading-[18px] mb-[7px]",
            )}
          >
            {I18n.t('almInfoModal2.ex.merits')}
          </p>
          <p
            className={join(
              "text-[15px] font-normal",
              "text-[#8B96B2] mb-[15px]",
            )}
          >
            {I18n.t('almInfoModal2.ex.title')}
          </p>
          <div>
            <LabelAndValue
              className="ALMInfoModal2__LabelAndValue ALMInfoModal2__LabelAndValue--withIcon"
              label={I18n.t('boostInfoModal.maxLeverage')}
              value={(
                <>
                  <BeforeAfter
                    imgSrc={"/static/images/exported/arrow icon.svg"}
                    before={`${leverageCap}${I18n.t('farming.multiplyLabel')}`}
                    after={`${boostedLeverageCap}${I18n.t('farming.multiplyLabel')}`}
                  />
                </>
              )}
            />
            <LabelAndValue
              className="ALMInfoModal2__LabelAndValue"
              label={(
                <div>
                  <p>{I18n.t('boostInfoModal.liquidationLimit')}</p>
                </div>
              )}
              value={(
                <>
                  <BeforeAfter
                    imgSrc={"/static/images/exported/arrow icon.svg"}
                    before={`${liquidationThreshold.toFixed(2)}%`}
                    after={`${boostedLiquidationThreshold.toFixed(2)}%`}
                  />
                </>
              )}
            />
            <LabelAndValue
              className="ALMInfoModal2__LabelAndValue"
              label={(
                <div>
                  <p>{I18n.t('boostInfoModal.liquidationFee')}</p>
                </div>
              )}
              value={(
                <>
                  <BeforeAfter
                    imgSrc={"/static/images/exported/arrow icon.svg"}
                    before={liquidationFee}
                    after={boostedLiquidationFee}
                  />
                </>
              )}
            />
            <LabelAndValue
              className="ALMInfoModal2__LabelAndValue"
              label={(
                <div>
                  <p>{I18n.t('boostInfoModal.liquidationReward')}</p>
                </div>
              )}
              value={(
                <>
                  <BeforeAfter
                    imgSrc={"/static/images/exported/arrow icon.svg"}
                    before={liquidationReward}
                    after={boostedLiquidationReward}
                  />
                </>
              )}
            />
          </div>
          <div
            className={join(
              "mt-[20px]",
            )}
          >
            <span
              className={join(
                "text-[#969BAB] text-[14px] leading-[21px] font-[500]",
              )}
            >
              {I18n.t('almInfoModal2.ex.info')}
            </span>
            <div
              className={join(
                "inline-block items-center",
                "ml-[4px]",
                "cursor-pointer",
              )}
              onClick={() => {
                window.open('https://medium.com/@KLEVA_Protocol_official/product-update-kleva-membership-4ae8361417cc')
              }}
            >
              <span
                className={join(
                  "text-[15px] text-[#222222] font-[500]",
                )}
              >
                {I18n.t('almInfoModal2.ex.link')}
              </span>
              <img
                className={join(
                  "w-[8px] h-[13px]",
                  "ml-[4px]",
                )}
                src="/static/images/exported/right-black-arrow.svg" 
              />
            </div>
          </div>
        </div>
      </Modal>
    )
  }
}

export default ALMInfoModal2