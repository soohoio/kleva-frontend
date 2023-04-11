import React, { Component, Fragment, createRef } from 'react'
import { twMerge, join } from 'tailwind-merge'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'
import { I18n } from '../common/I18n'

class ALMStakingStatus extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      of(true),
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
    const {
      ibKlevaStakingBalance,
    } = this.props
    
    return (
      <div
        className={join(
          "flex items-center justify-between",
          "text-[#9585A6] text-[15px] font-[500] leading-[18px]",
          "mb-[10px]",
          "dt:w-[295px]"
        )}
      >
        <span>
          <span
            className={join(
              "text-[#8F00FF] font-[700]",
            )}
          >
            {ibKlevaStakingBalance} ibKLEVA
          </span> {I18n.t('myasset.inStaking')}
        </span>
        <span>
          {I18n.t('membership')} 7,500
        </span>
      </div>
    )
  }
}

export default ALMStakingStatus