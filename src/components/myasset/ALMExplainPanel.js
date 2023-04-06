import React, { Component, Fragment, createRef } from 'react'
import { twMerge, join } from 'tailwind-merge'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'
import { I18n } from '../common/I18n'

class ALMExplainPanel extends Component {
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
    
    return (
      <div 
        className={join(
          "flex flex-col dt:flex-row dt:items-center dt:justify-between",
          "dt:w-[980px] dt:h-[52px]",
          "mt-[20px] mx-[20px] dt:mx-auto dt:mt-[40px]",
          "p-[25px]",
          "rounded-[8px]",
          "bg-[#F8F2FF]",
       )}
      >
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
              "text-[#9585A6] text-[15px] font-[500]",
              "leading-[21px]",
              "mb-[13px]",
              "dt:mb-0",
            )}
          >
            {I18n.t('almExplainPanel.title')}
          </p>
        </div>
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
      </div>
    )
  }
}

export default ALMExplainPanel