import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './Dashboard.scss'

import { I18n } from 'components/common/I18n'
import { prevPath$ } from 'streams/location'
import { burnHistoryData$, chartData$, fetchChartData$, getBurnHistory$ } from '../../streams/chart'
import ChartItem from './ChartItem'
import { noRounding, getQS, backPage } from '../../utils/misc'
import TotalSupplyInfo from './TotalSupplyInfo'
import { currentTab$ } from '../../streams/view'
import ThickHR from '../common/ThickHR'
import { prevLocation$ } from '../../streams/location'
import { lendingTokenSupplyInfo$ } from '../../streams/vault'
import { farmPoolDeposited$ } from '../../streams/farming'
import { lendingPools } from '../../constants/lendingpool'

class Dashboard extends Component {

  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      chartData$,
      lendingTokenSupplyInfo$,
      farmPoolDeposited$,
    ).pipe(
      debounceTime(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })
    
    fetchChartData$().subscribe((chartData) => {
      chartData$.next(chartData)
    })

    getBurnHistory$().subscribe((burnHistoryData) => {
      burnHistoryData$.next(burnHistoryData)
    })
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }

  getTVL = () => {
    const lendingPoolTVL = lendingPools.reduce((acc, { stakingToken, vaultAddress }) => {

      // Lending Pool TVL Info
      const lendingTokenSupplyInfo = lendingTokenSupplyInfo$.value[vaultAddress]
      const depositedTokenBalance = lendingTokenSupplyInfo && lendingTokenSupplyInfo.depositedTokenBalance

      const tvl = new BigNumber(depositedTokenBalance)
        .multipliedBy(tokenPrices$.value[stakingToken.address.toLowerCase()])
        .toNumber()

      return acc += isNaN(tvl) ? 0 : tvl
    }, 0)

    const farmPoolTVL = farmPoolDeposited$.value && Object.values(farmPoolDeposited$.value).reduce((acc, cur) => {

      const _farmTVL = new BigNumber(cur && cur.deposited)

      return new BigNumber(acc).plus(_farmTVL).toNumber()
    }, 0)

    return new BigNumber(lendingPoolTVL)
      .plus(farmPoolTVL)
      .toNumber() || "-"
  }
    
  render() {

    const totalTVLData = chartData$.value['total_tvl']
    const lendingData = chartData$.value['lending_tvl']
    const farmingData = chartData$.value['farming_tvl']

    const klevaCirculationData = chartData$.value['kleva_circulation']
    const klevaLockedData = chartData$.value['kleva_platform_locked']
    const klevaTotalSupplyData = chartData$.value['kleva_totalsupply']
    const klevaBuybackburnFundData = chartData$.value['kleva_buybackburn_fund']
    const klevaBurnData = chartData$.value['kleva_burn']

    return !!chartData$.value && (
      <div className="Dashboard">
        <div className="DashboardHeader">
          <p className="DashboardHeader__title">
            {I18n.t('dashboard')}
            <img
              onClick={() => {
                backPage()
              }}
              className="DashboardHeader__close"
              src="/static/images/close-black.svg?date=20220929"
            />
          </p>
        </div>
        <div className="Dashboard__content">
          <div className="Dashboard__left">
            
            <div className="Dashboard__realtime">
              <div className="Dashboard__realtimeTop">
                <img src="/static/images/exported/logo-kleva-2.svg?date=20220929" /> 
                <span>{I18n.t('dashboard.tvlChart.title')}</span>
              </div>
              <p className="Dashboard__realtimeTVL">${noRounding(this.getTVL(), 0)}</p>
              <p className="Dashboard__realTimeDescription">{I18n.t('dashboard.realtime.description')}</p>
            </div>

            <ChartItem
              key="tvl"
              chartId="tvl"
              title={I18n.t('dashboard.tvlChart.title2')}
              value={`$${totalTVLData && noRounding(totalTVLData[totalTVLData.length - 1]?.value, 0)}`}
              primaryColor="#1A56FF"
              subColor="#7DB6FA"
              strokeColor="#2E66FF"
              popupColor="#245EFF"
              gradientColor="rgb(67,117,255)"
              borderLineColor="#99B1F3"
              circleColor="#2F62FF"
              className="Dashboard__tvlChart"
              chartData={totalTVLData}
              height={260}
            />
            <div className="Dashboard__lendnfarming">
              <ChartItem
                key="lending"
                chartId="lending"
                title={I18n.t('dashboard.lendingChart.title')}
                value={`$${lendingData && noRounding(lendingData[lendingData.length - 1]?.value, 0)}`}
                primaryColor="#21A3FF"
                subColor="#87D4FF"
                strokeColor="#29B8FF"
                popupColor="#00A2F3"
                gradientColor="rgb(41,184,255)"
                borderLineColor="#99D5F3"
                circleColor="#29B8FF"
                className="Dashboard__lendingChart"
                chartData={lendingData}
                height={220}
                chartMaxHeight={120}
                yAxisArr={[0, 1, 2, 3]}
              />
              <ChartItem
                key="farming"
                chartId="farming"
                title={I18n.t('dashboard.farmingChart.title')}
                value={`$${farmingData && noRounding(farmingData[farmingData.length - 1]?.value, 0)}`}
                primaryColor="#21A3FF"
                subColor="#87D4FF"
                strokeColor="#29B8FF"
                popupColor="#00A2F3"
                gradientColor="rgb(41,184,255)"
                borderLineColor="#99D5F3"
                circleColor="#29B8FF"
                className="Dashboard__farmingChart"
                chartData={farmingData}
                height={220}
                chartMaxHeight={120}
                yAxisArr={[0, 1, 2, 3]}
              />
            </div>
          </div>
          <ThickHR size="10" className="mobileOnly" />
          <div className="Dashboard__right">
            <TotalSupplyInfo 
              totalTVLData={totalTVLData}
              klevaCirculationData={klevaCirculationData}
              klevaLockedData={klevaLockedData}
              klevaTotalSupplyData={klevaTotalSupplyData}
              klevaBuybackburnFundData={klevaBuybackburnFundData}
              klevaBurnData={klevaBurnData}
            />
          </div>
        </div>
      </div>
    )
  }
}

export default Dashboard