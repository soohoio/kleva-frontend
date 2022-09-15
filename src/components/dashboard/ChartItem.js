import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './ChartItem.scss'
import Chart from './Chart'
import { chartData$ } from '../../streams/chart'

class ChartItem extends Component {

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
      chartId,
      title, 
      value, 
      primaryColor, 
      subColor,
      className, 
      chartData,
      strokeColor,
      circleColor,
      borderLineColor,
      popupColor,
      gradientColor,

      chartMaxHeight,
    } = this.props
    
    if (!chartData || chartData.length == 0) return false

    const lastUpdatedDate = chartData[chartData.length - 1] && chartData[chartData.length - 1].date
    const updatedAt = lastUpdatedDate.getFullYear()
      + "."
      + String(lastUpdatedDate.getMonth() + 1).padStart(2, "0")
      + "."
      + String(lastUpdatedDate.getDate()).padStart(2, "0")
      + ". "
      + String(lastUpdatedDate.getHours()).padStart(2, "0")
      + ":"
      + String(lastUpdatedDate.getMinutes()).padStart(2, "0")

    return (
      <div className={cx("ChartItem", className)}>
        <p style={{ color: primaryColor }} className="ChartItem__title">{title}</p>
        <p className="ChartItem__value">{value}</p>
        <p className="ChartItem__lastUpdated">{updatedAt}</p>
        <Chart 
          chartId={chartId}
          primaryColor={primaryColor}
          subColor={subColor}
          strokeColor={strokeColor}
          borderLineColor={borderLineColor}
          circleColor={circleColor}
          popupColor={popupColor}
          gradientColor={gradientColor}
          chartData={chartData}
          chartMaxHeight={chartMaxHeight}
        />
      </div>
    )
  }
}

export default ChartItem