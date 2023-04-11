import React, { Component, Fragment, createRef } from 'react'
import { twMerge, join } from 'tailwind-merge'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'
import { I18n } from '../common/I18n'
import { balancesInStakingPool$, selectedAddress$ } from '../../streams/wallet'
import { ibTokens } from '../../constants/tokens'
import ALMStakingStatus from './ALMStakingStatus'
import ALMStakingGauge from './ALMStakingGauge'
import QuestionMark from '../common/QuestionMark'
import { openModal$ } from '../../streams/ui'
import ALMInfoModal2 from '../modals/ALMInfoModal2'

class ALMExplainPanel extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      selectedAddress$,
      balancesInStakingPool$,
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
      isMembershipApplied,
    }
  }

  baseContent = () => {
    return (
      <div
        className="flex flex-col dt:items-center dt:flex-row"
      >
        <img
          className={join(
            "h-[15px]",
            "mb-[18px] mr-auto",
            "dt:mb-0 dt:mr-[16px]",
          )}
          src="/static/images/exported/membership-title-kr.svg"
        />
        <p
          className={join(
            selectedAddress$.value 
              ? "hidden dt:block"
              : "block"
            ,
            "text-[#9585A6] text-[15px] font-[500]",
            "leading-[21px]",
            "mb-[13px]",
            "dt:mb-0",
          )}
        >
          {I18n.t('almExplainPanel.title')}
        </p>
      </div>
    )
  }

  renderContent = () => {

    // Not logged in
    if (!selectedAddress$.value) {
      return (
        <>
          {this.baseContent()}
          <p
            className={join(
              "flex items-center",
              "text-[#8F00FF] text-[15px] leading-[16px]",
              "font-[500]"
            )}
          >
            {I18n.t('almExplainPanel.detail')}
            <img
              className={join(
                "ml-[4px]",
              )}
              src="/static/images/exported/right-purple-arrow.svg"
            />
          </p>
        </>
      )
    }

    const {
      ibKlevaStakingBalance,
      stakingPercentage,
    } = this.getStatus()

    return (
      <>
        {this.baseContent()}
        <div
          className={join(
            "flex flex-col",
          )}
        >
          <ALMStakingStatus
            ibKlevaStakingBalance={ibKlevaStakingBalance}
          />
          <ALMStakingGauge
            stakingPercentage={stakingPercentage}
          />
        </div>
      </>
    )
    
  }
    
  render() {
    const hasSelectedAddress = !!selectedAddress$.value

    const {
      isMembershipApplied,
    } = this.getStatus()
    
    if (true || (hasSelectedAddress && isMembershipApplied)) {
      return (
        <div
          className={join(
            "flex justify-between items-center",
            "mt-[20px] mx-[20px] dt:mx-auto",
            "p-[20px]",
            "dt:w-[980px]",
            "h-[52px]",
            "rounded-[9px]",
            "bg-gradient-to-r from-[#4E00F2] to-[#BF0CDC]"
          )}
        >
          <div
            className="flex items-center"
          >
            <img
              className={join(
                "h-[16px]",
              )}
              src="/static/images/exported/membership-title-kr-white.svg" 
            />
            <QuestionMark
              transparent
              onClick={() => {
                openModal$.next({
                  component: <ALMInfoModal2 />
                })
              }}
            />
          </div>
          <span
            className="text-[15px] text-[#F4D6FF] font-[600] leading-[16px]"
          >
            {I18n.t('membership.applied')}
          </span>
        </div>
      )
    }

    return (
      <div 
        className={join(
          "flex flex-col dt:flex-row dt:items-center dt:justify-between",
          "dt:w-[980px] dt:h-[52px]",
          hasSelectedAddress
            ? ["mx-0"]
            : ["mx-[20px]"],
          "mt-[20px] dt:mx-auto dt:mt-[40px]",
          "p-[25px]",
          "rounded-[8px]",
          "bg-[#F8F2FF]",
       )}
      >
        {this.renderContent()}
      </div>
    )
  }
}

export default ALMExplainPanel