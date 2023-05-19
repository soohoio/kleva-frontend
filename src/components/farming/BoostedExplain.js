import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { join, twMerge } from 'tailwind-merge'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import { I18n } from '../common/I18n'
import { ibTokens } from '../../constants/tokens'
import { balancesInStakingPool$ } from '../../streams/wallet'

class BoostedExplain extends Component {

  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
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
    
  render() {
    const {
      isMembershipApplied,
    } = this.getStatus()
    
    return (
      <div 
        className={join(
          "flex flex-col",
          "bg-[#F8F2FF] p-[20px]",
          "rounded-[8px]",
          "dt:h-[112px] dt:w-[335px]",
        )}
      >
        <img
          className="w-[92px] h-[19px] mb-[12px]"
          src="/static/images/exported/boosted-2.svg" 
        />
        <p
          className={join(
            "text-[14px] leading-[21px] text-[#9585A6]",
            "font-[500]"
          )}
        >
          {isMembershipApplied
            ? I18n.t('membership.farming.description.applied')
            : I18n.t('membership.farming.description')
          }
        </p>
      </div>
    )
  }
}

export default BoostedExplain