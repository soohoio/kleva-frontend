import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './Dashboard.scss'

import { I18n } from 'components/common/I18n'
import { chartData$, fetchChartData$ } from '../../streams/chart'
import ChartItem from './ChartItem'
import { noRounding } from '../../utils/misc'
import TotalSupplyInfo from './TotalSupplyInfo'
import { currentTab$ } from '../../streams/view'
import ThickHR from '../common/ThickHR'

class Dashboard extends Component {

  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      chartData$,
    ).pipe(
      debounceTime(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })
    
    fetchChartData$().subscribe((chartData) => {
      console.log(chartData, 'chartData')
      chartData$.next(chartData)
    })
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }
    
  render() {

    const totalTVLData = chartData$.value['total_tvl']
    const lendingData = chartData$.value['lending_tvl']
    const farmingData = chartData$.value['farming_tvl']

    return !!chartData$.value && (
      <div className="Dashboard">
        <div className="DashboardHeader">
          <p className="DashboardHeader__title">
            {I18n.t('dashboard')}
            <img
              onClick={() => {
                currentTab$.next('myasset')
              }}
              className="DashboardHeader__close"
              src="/static/images/close-black.svg"
            />
          </p>
        </div>
        <div className="Dashboard__content">
          <div className="Dashboard__left">
            <ChartItem
              chartId="tvl"
              title={(
                <>
                  <img src="/static/images/exported/logo-kleva-2.svg" />
                  <span>{I18n.t('dashboard.tvlChart.title')}</span>
                </>
              )}
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
            />
            <div className="Dashboard__lendnfarming">
              <ChartItem
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
                chartMaxHeight={120}
              />
              <ChartItem
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
                chartMaxHeight={120}
              />
            </div>
          </div>
          <ThickHR size="10" className="mobileOnly" />
          <div className="Dashboard__right">
            <TotalSupplyInfo />
          </div>
        </div>
      </div>
    )
  }
}

export default Dashboard