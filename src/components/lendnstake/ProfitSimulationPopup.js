import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, filter, debounceTime } from 'rxjs/operators'

import Bloc from './ProfitSimulationPopup.bloc'

import './ProfitSimulationPopup.scss'
import Modal from '../common/Modal'
import { I18n } from '../common/I18n'
import InputWithPercentage from '../common/InputWithPercentage'
import { toAPY } from '../../utils/calc'
import { BigNumber } from 'bignumber.js';
import { tokenPrices$ } from '../../streams/tokenPrice'
import { nFormatter } from '../../utils/misc'
import LabelAndValue from '../LabelAndValue'

class ProfitSimulationPopup extends Component {
  bloc = new Bloc(this)

  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      this.bloc.amount$,
      this.bloc.timePassed$.pipe(
        tap(() => {
          this.calculate()
        })
      ),
      this.bloc.protocolProfit$,
      this.bloc.lendingProfit$,
      this.bloc.stakingProfit$,
      this.bloc.totalCompoundProfit$,
      this.bloc.calculatedOnce$,
      tokenPrices$,
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

  calculate = () => {
    const { stakingToken, protocolAPR, lendingAPR, stakingAPR } = this.props
    
    const totalAPR = this.bloc.getTotalAPR({ lendingAPR, stakingAPR, protocolAPR })

    const totalAPY = toAPY(totalAPR)

    this.bloc.calculate({ stakingToken, lendingAPR, stakingAPR, protocolAPR, totalAPY })
  }
    
  render() {
    const { stakingToken, protocolAPR, lendingAPR, stakingAPR } = this.props
    const isDisabled = !this.bloc.amount$.value || this.bloc.amount$.value == 0

    const protocolProfitInDollar = this.bloc.amountInDollar(stakingToken, this.bloc.protocolProfit$.value)
    const lendingProfitInDollar = this.bloc.amountInDollar(stakingToken, this.bloc.lendingProfit$.value)
    const stakingProfitInDollar = this.bloc.amountInDollar(stakingToken, this.bloc.stakingProfit$.value)
    const totalCompoundProfitInDollar = this.bloc.amountInDollar(stakingToken, this.bloc.totalCompoundProfit$.value)

    const totalAPR = this.bloc.getTotalAPR({ stakingAPR, protocolAPR, lendingAPR })

    const totalAPY = toAPY(totalAPR)
    
    const profitRate = new BigNumber(totalAPY)
      .multipliedBy(this.bloc.timePassed$.value)
      .div(365)
      .toNumber()

    return (
      <Modal>
        <p className="ProfitSimulationPopup__title">{I18n.t('lendstake.profitsimulation.title')}</p>

        <div className="ProfitSimulationPopup__inputAndButton">
          <InputWithPercentage
            autoFocus
            noPercentage
            className="ProfitSimulationPopup__depositInput"
            decimalLimit={stakingToken.decimals}
            value$={this.bloc.amount$}
            targetToken={stakingToken}
            label={stakingToken.title}
            onEnterKey={() => {
              if (isDisabled) return
              this.calculate()
            }}
          />
          <button
            onClick={() => {
              if (isDisabled) return
              this.calculate()
            }}
            className={cx("ProfitSimulationPopup__calculateButton", {
              "ProfitSimulationPopup__calculateButton--disabled": isDisabled,
            })}
          >
            {I18n.t('calculate')}
          </button>
        </div>

        {this.bloc.totalCompoundProfit$.value != 0 && (
          <>
            <div className="ProfitSimulationPopup__expectedProfit">
              <p className="ProfitSimulationPopup__expectedProfitTitle">{I18n.t(`days${this.bloc.timePassed$.value}`)} {I18n.t('expectedProfit')}</p>
              <div className="ProfitSimulationPopup__expectedProfitValue">
                ${nFormatter(totalCompoundProfitInDollar, 2)} <span className="ProfitSimulationPopup__expectedProfitRate">+{nFormatter(profitRate, 2)}%</span>
              </div>
            </div>

            <div className="ProfitSimulationPopup__profitDetail">
              {this.bloc.protocolProfit$.value != 0 && (
                <LabelAndValue
                  label={I18n.t('protocolProfit')}
                  value={(
                    <>
                      {nFormatter(this.bloc.protocolProfit$.value, 2)} {stakingToken.title} (${nFormatter(protocolProfitInDollar, 2)})
                  </>
                  )}
                />
              )}
              <LabelAndValue
                label={I18n.t('lendingProfit')}
                value={(
                  <>
                    {nFormatter(this.bloc.lendingProfit$.value, 2)} {stakingToken.title} (${nFormatter(lendingProfitInDollar, 2)})
                  </>
                )}
              />
              <LabelAndValue
                label={I18n.t('stakingProfit')}
                value={(
                  <>
                    {nFormatter(this.bloc.stakingProfitInKLEVA$.value, 2)} KLEVA (${nFormatter(stakingProfitInDollar, 2)})
                  </>
                )}
              />
              <hr className="ProfitSimulationPopup__hr" />
              <LabelAndValue
                className="ProfitSimulationPopup__appliedAPY"
                label={I18n.t('apyApplied')}
                value={(
                  <>
                    ${nFormatter(totalCompoundProfitInDollar, 2)}
                  </>
                )}
              />
            </div>

            <div className="ProfitSimulationPopup__dayTabs">
              <div 
                className={cx("ProfitSimulationPopup__tab", {
                  "ProfitSimulationPopup__tab--active": this.bloc.timePassed$.value == 10,
                })}
                onClick={() => this.bloc.timePassed$.next(10)}
              >
                {I18n.t('days10')}
              </div>
              <div 
                className={cx("ProfitSimulationPopup__tab", {
                  "ProfitSimulationPopup__tab--active": this.bloc.timePassed$.value == 30,
                })}
                onClick={() => this.bloc.timePassed$.next(30)}
              >
                {I18n.t('days30')}
              </div>
              <div 
                className={cx("ProfitSimulationPopup__tab", {
                  "ProfitSimulationPopup__tab--active": this.bloc.timePassed$.value == 180,
                })}
                onClick={() => this.bloc.timePassed$.next(180)}
              >
                {I18n.t('days180')}
              </div>
              <div 
                className={cx("ProfitSimulationPopup__tab", {
                  "ProfitSimulationPopup__tab--active": this.bloc.timePassed$.value == 365,
                })}
                onClick={() => this.bloc.timePassed$.next(365)}
              >
                {I18n.t('days365')}
              </div>
            </div>
            

            <p className="ProfitSimulationPopup__caution">{I18n.t('lendstake.profitsimulation.caution')}</p>
          </>
        )}
        
      </Modal>
    )
  }
}

export default ProfitSimulationPopup