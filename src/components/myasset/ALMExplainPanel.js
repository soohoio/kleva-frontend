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
import { currentLocale$ } from '../../streams/i18n'

class ALMExplainPanel extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      selectedAddress$,
      balancesInStakingPool$,
      currentLocale$,
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

  renderContent = () => {

    // Not logged in
    if (!selectedAddress$.value) {
      return (
        <>
          <div
            className="flex flex-col dt:items-center dt:flex-row"
          >
            <div
              className="flex items-center mr-auto mb-[12px] dt:mb-0"
            >
              <img
                className={join(
                  currentLocale$.value === 'en'
                    ? "w-[140px] h-[16px]"
                    : "w-[112px] h-[16px]"
                  ,
                  (selectedAddress$.value)
                    ? "dt:mb-[12px] dt:mr-[16px]"
                    : "dt:mb-0 dt:mr-[16px]",
                )}
                src={currentLocale$.value === 'en'
                  ? "/static/images/exported/[BI]KM140x16_color.svg"
                  : "/static/images/exported/112x16.svg"
                }
              />
              {/* <QuestionMark
                className="dt:hidden"
                color="#FBF7FF"
                transparent
                onClick={() => {
                  openModal$.next({
                    component: <ALMInfoModal2 />
                  })
                }}
              /> */}
            </div>
            <p
              className={join(
                selectedAddress$.value
                  ? "hidden dt:block"
                  : "block"
                ,
                "text-[#9585A6] text-[15px] font-[500] dt:text-[14px]",
                "leading-[21px]",
                "mb-[12px]",
                "dt:mb-0",
              )}
            >
              {I18n.t('almExplainPanel.title')}
            </p>
          </div>
          <p
            onClick={() => {
              openModal$.next({
                component: <ALMInfoModal2 />,
              })
            }}
            className={join(
              "flex items-center",
              "text-[#8F00FF] text-[15px] leading-[16px] dt:text-[14px]",
              "font-[500]",
              "cursor-pointer",
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
      isMembershipApplied,
    } = this.getStatus()

    return (
      <>
        <div
          className={join(
            "flex flex-col dt:items-center",
            (selectedAddress$.value) 
              ? "dt:h-[92px] justify-center"
              : "dt:h-[52px]"
          )}
        >
          <div
            className="flex items-center mr-auto mb-[18px] dt:mb-0"
          >
            <img
              className={join(
                currentLocale$.value === 'en' 
                  ? "w-[140px] h-[16px]"
                  : "w-[112px] h-[16px]"
                ,
                (selectedAddress$.value) 
                  ? "dt:mb-[12px] dt:mr-[16px] dt:relative dt:top-[3px]"
                  : "dt:mb-0 dt:mr-[16px]",
              )}
              src={currentLocale$.value === 'en' 
                ? "/static/images/exported/[BI]KM140x16_color.svg"
                : "/static/images/exported/112x16.svg"
              }
            />
            <QuestionMark
              className="dt:hidden w-[18px] h-[18px]"
              color="#FBF7FF"
              transparent
              onClick={() => {
                openModal$.next({
                  component: <ALMInfoModal2 />
                })
              }}
            />
          </div>
          {selectedAddress$.value 
            ? (
              <div
                className={join(
                  "flex items-center",
                  "hidden dt:block",
                  "text-[#9585A6] text-[15px] font-[500] dt:text-[14px]",
                  "leading-[21px]",
                  "mb-[13px]",
                  "dt:mb-0",
                  "cursor-pointer"
                )}
                onClick={() => {
                  openModal$.next({
                    component: <ALMInfoModal2 />,
                  })
                }}
              >
                {I18n.t('membership.applied2.desktop.description')}
                <span className="ml-[4px] text-[14px] leading-[16px] font-[600] text-[#8F00FF]">
                  {I18n.t('almExplainPanel.detail')}
                </span>
                <img
                  className={join(
                    "ml-[4px]",
                    "relative",
                    "top-[1px]",
                  )}
                  src="/static/images/exported/right-purple-arrow.svg"
                />
              </div>
            )
            : (
              <p
                className={join(
                  "block",
                  "text-[#9585A6] text-[15px] font-[500]",
                  "leading-[21px]",
                  "mb-[13px]",
                  "dt:mb-0",
                )}
              >

                {I18n.t('almExplainPanel.title')}
              </p>
            )
          }
        </div>
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
    const { className } = this.props

    const hasSelectedAddress = !!selectedAddress$.value

    const {
      isMembershipApplied,
    } = this.getStatus()
    
    if ((hasSelectedAddress && isMembershipApplied)) {
      return (
        <div
          className={twMerge(
            join(
              "flex justify-between items-center",
              "mt-[20px] mx-[20px] dt:mx-auto",
              "p-[20px] dt:px-[25px] dt:py-[20px]",
              "dt:w-[980px]",
              "h-[52px]",
              "rounded-[9px]",
              "bg-gradient-to-r from-[#4E00F2] to-[#BF0CDC]"
            ),
            className,
          )}
        >
          <div
            className="flex items-center"
          >
            <div
              className={join(
                "flex items-center",
              )}
            >
              <img
                className={join(
                  "h-[16px]",
                )}
                src={currentLocale$.value === 'en' 
                  ? "/static/images/exported/[BI]KM140x16_white.svg" 
                  : "/static/images/exported/membership-title-kr-white.svg"
                }
              />
              <QuestionMark
                className="dt:hidden ml-[5px] w-[18px] h-[18px]"
                transparent
                backgroundImage={"18x18_Icon_Info_KM"}
                onClick={() => {
                  openModal$.next({
                    component: <ALMInfoModal2 />
                  })
                }}
              />
            </div>

            {isMembershipApplied
              ? (
                <span
                  className={join(
                    "hidden dt:block text-[#F4D6FF] font-[500] text-[14px] leading-[16px] ml-[15px]",
                  )}
                >
                  {I18n.t('membership.applied.myasset.desktop.description')}
                </span>
              )
              : (
                <QuestionMark
                  transparent
                  onClick={() => {
                    openModal$.next({
                      component: <ALMInfoModal2 />
                    })
                  }}
                />
              )
            }
          </div>
          <span
            className="dt:hidden text-[15px] text-[#F4D6FF] font-[600] leading-[16px]"
          >
            {I18n.t('membership.applied')}
          </span>

          <div 
            className="hidden dt:flex items-center cursor-pointer"
            onClick={() => {
              openModal$.next({
                component: <ALMInfoModal2 />
              })
            }}
          >
            <span className="ml-[4px] text-[14px] leading-[16px] font-[600] text-[#FFFFFF]">{I18n.t('almExplainPanel.detail')}</span>
            <img
              className={join(
                "ml-[3px]",
                "relative",
              )}
              src="/static/images/exported/icon_7x12_arrow.svg"
            />
          </div>
        </div>
      )
    }

    return (
      <div 
        className={join(
          "flex flex-col dt:flex-row dt:items-center dt:justify-between",
          "dt:w-[980px]",
          hasSelectedAddress
            ? ["mx-0 dt:h-[92px]"]
            : ["mx-[20px] dt:h-[52px]"],
          "mt-[20px] dt:mx-auto",
          "py-[20px] px-[22px] dt:p-[25px]",
          "rounded-[8px] dt:rounded-[9px]",
          "bg-[#F8F2FF]",
       )}
      >
        {this.renderContent()}
      </div>
    )
  }
}

export default ALMExplainPanel