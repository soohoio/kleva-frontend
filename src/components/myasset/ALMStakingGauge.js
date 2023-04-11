import React, { Component, Fragment, createRef } from 'react'
import { twMerge, join } from 'tailwind-merge'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'


class ALMStakingGauge extends Component {
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
    const { stakingPercentage } = this.props
    
    return (
      <div
        className={join(
          "relative",
          "w-[100%] h-[4px]",
          "bg-[#E6D8F5]",
          "rounded-[2px]"
        )}
      >
        <div
          style={{ width: `${stakingPercentage}%` }}
          className={join(
            "absolute left-0 top-[50%] translate-y-[-50%]",
            "h-[4px]",
            "bg-gradient-to-r from-[#7D20FF] to-[#D30CF3]",
            "rounded-[2px]"
          )}
        />
      </div>
    )
  }
}

export default ALMStakingGauge