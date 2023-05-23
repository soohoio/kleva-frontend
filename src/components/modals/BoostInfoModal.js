import React, { Component, Fragment, createRef } from 'react'
import { join } from 'tailwind-merge'
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
import { ibTokens } from '../../constants/tokens'
import { balancesInStakingPool$ } from '../../streams/wallet'

class BoostInfoModal extends Component {

  destroy$ = new Subject()

  componentDidMount() {

  }

  componentWillUnmount() {
    this.destroy$.next(true)
  }

  getStatus = () => {
    const ibKleva = ibTokens.ibKLEVA

    const ibKlevaStakingBalance = balancesInStakingPool$.value?.[ibKleva.address]?.balanceParsed

    const stakingPercentage = Math.min(
      (ibKlevaStakingBalance / 7500) * 100,
      100
    )

    const isMembershipApplied = stakingPercentage >= 100

    return {
      ibKlevaStakingBalance,
      stakingPercentage,
      isMembershipApplied: true,
    }
  }

  render() {

    const { 
      workerConfig,
    } = this.props

    const {
      workFactorBps,
      killFactorBps,
      killTreasuryBps,
      liquidatePrizeBps,
      
      membershipKillFactorBps,
      membershipWorkFactorBps,
      membershipKillTreasuryBps,
      membershipLiquidatePrizeBps,
    } = workerConfig

    const { isMembershipApplied } = this.getStatus()

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
        className="BoostInfoModal"
        title="Boosted"
      >
        {isMembershipApplied
          ? (
            <div
              className={join(
                "flex flex-col",
                "mb-[17px]",
              )}
            >
              <p
                className={join(
                  "text-[#8F00FF] text-[17px] font-bold",
                  "mb-[5px]",
                )}
              >
                {I18n.t('membership.applied2')}
              </p>
              <p
                className={join(
                  "text-[#636878]",
                )}
              >
                {I18n.t('membership.applied2.description')}
              </p>
            </div>
          )
          : (
            <p
              className="BoostInfoModal__description"
            >
              {I18n.t('boostInfoModal.description')}
            </p>
          )
        }
        <div
          className="BoostInfoModal__content"
        >
          <LabelAndValue
            className="BoostInfoModal__LabelAndValue"
            label={I18n.t('boostInfoModal.maxLeverage')}
            value={(
              <>
                <BeforeAfter
                  imgSrc={"/static/images/exported/arrow icon.svg"}
                  before={(
                    <>
                      {isMembershipApplied 
                        ? (
                          <div className="flex items-center">
                            <img
                              className="w-[72px] h-[15px] mr-[8px]"
                              src="/static/images/exported/boosted.svg" 
                            />
                            {leverageCap}{I18n.t('farming.multiplyLabel')}
                          </div>
                        )
                        : `${leverageCap}${I18n.t('farming.multiplyLabel')}`
                      }
                    </>
                  )}
                  after={<span className={isMembershipApplied && "text-[#8F00FF]"}>{boostedLeverageCap}{I18n.t('farming.multiplyLabel')}</span>}
                />
              </>
            )}
          />
          <LabelAndValue
            className="BoostInfoModal__LabelAndValue"
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
                  after={<span className={isMembershipApplied && "text-[#8F00FF]"}>{boostedLiquidationThreshold.toFixed(2)}%</span>}
                />
              </>
            )}
          />
          <LabelAndValue
            className="BoostInfoModal__LabelAndValue"
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
                  after={<span className={isMembershipApplied && "text-[#8F00FF]"}>{boostedLiquidationFee}</span>}
                />
              </>
            )}
          />
          <LabelAndValue
            className="BoostInfoModal__LabelAndValue"
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
                  after={<span className={isMembershipApplied && "text-[#8F00FF]"}>{boostedLiquidationReward}</span>}
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