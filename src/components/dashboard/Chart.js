import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of, BehaviorSubject, fromEvent } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './Chart.scss'
import { nFormatter, noRounding } from '../../utils/misc'

import { currentLocale$ } from 'streams/i18n'
import { buildSmoothPath } from '../../utils/svg'

const CircleWrapper = ({ 
  date, 
  subColor, 
  popupColor, 
  borderLineColor, 
  circleColor, 
  value, 
  OFFSET_X, 
  x, 
  y, 
  activeCoordinates$,
  
  chartMaxHeight,
  BUFFER_Y,
}) => {

  const isActive = activeCoordinates$.value.x === x && activeCoordinates$.value.y === y

  const activeRectWidth = 118
  const activeRectHeight = 50

  const title = `$${noRounding(value, 0)}`
  const subtitle = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`

  const foreignX = (x - activeRectWidth / 2) > 0
    ? x - activeRectWidth / 2
    : 0

  const foreignY = y - 76

  return (
    <g className="Chart__circleWrapper">
      <rect
        onMouseEnter={() => {
          activeCoordinates$.next({ x, y })
        }}
        onMouseLeave={() => {
          // console.log('leaved', x, y)
          // activeCoordinates$.next({ x: null, y: null })
        }}
        fill="transparent"
        x={x - OFFSET_X / 2}
        y="0"
        width={OFFSET_X}
        height={"100%"}
      />
      {isActive && (
        <g className="Chart__activeItem">
          <line 
            x1={x} 
            y1={y - 26} 
            x2={x} 
            y2={chartMaxHeight + BUFFER_Y} 
            stroke={borderLineColor}
            strokeDasharray="3"
          />
          <foreignObject 
            x={foreignX}
            y={foreignY}
            width={activeRectWidth}
            height={140}
          >
            <div
              style={{
                backgroundColor: popupColor
              }}
              className="Chart__itemDetail"
            >
              <p className="Chart__itemDetailTitle">{title}</p>
              <p 
                style={{
                  color: subColor
                }} 
                className="Chart__itemDetailSubtitle"
              >
                {subtitle}
              </p>
            </div>
          </foreignObject>
          <circle fill={circleColor} cx={x} cy={y} r="4" />
        </g>
      )}
    </g>
  )
}

class Chart extends Component {
  $chart = createRef()
  $svg = createRef()

  destroy$ = new Subject()

  path$ = new BehaviorSubject()
  filledPath$ = new BehaviorSubject()
  circles$ = new BehaviorSubject()
  activeCoordinates$ = new BehaviorSubject({ x: null, y: null })
  chartVisibleWidth$ = new BehaviorSubject()
  xAxis$ = new BehaviorSubject([])
  yAxis$ = new BehaviorSubject([])
  
  componentDidMount() {
    const { 
      chartId,

    } = this.props

    merge(
      this.path$,
      this.filledPath$,
      this.circles$,
      this.xAxis$,
      this.yAxis$,
      this.activeCoordinates$,
      this.chartVisibleWidth$,
      currentLocale$,
    ).pipe(
      debounceTime(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })

    fromEvent(window, 'resize').pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      const chartElem = document.querySelector(`#chart-${chartId}`)

      this.draw(chartElem, this.getIngredients())
    })
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }

  getWidth = () => {

  }

  calcXAxis = (xAxisOffset, idx, lastIdx) => {

    if (idx == 0) {
      return this.chartVisibleWidth$.value - 20
    }

    if (idx == lastIdx) {
      return 0
    }
    
    return (xAxisOffset * (3 - idx)) - 24
  }

  draw = (elem, { chartMaxHeight, X_AXIS_VISIBLE_HEIGHT, BUFFER_Y }) => {
    const { 
      chartData,
      subColor,
      popupColor,
      borderLineColor,
      circleColor,
      yAxisArr = [0, 1, 2, 3, 4],
    } = this.props

    if (!elem) return
    const { width } = elem.getBoundingClientRect()

    const chartVisibleWidth = width - 60 // 60: yAxis font width
    this.chartVisibleWidth$.next(chartVisibleWidth)

    const maxValue = chartData.reduce((acc, { value }) => Math.max(acc, value), 0)
    const ceiledUpper = Math.ceil(maxValue / 10 ** (String(maxValue).length - 1)) * 10 ** (String(maxValue).length - 1)

    const OFFSET_X = (chartVisibleWidth / (chartData.length - 1))

    const itemCoordinates = chartData.map(({ date, value }, idx) => {

      const x = OFFSET_X * idx
      const y = BUFFER_Y + chartMaxHeight - (chartMaxHeight * (value / ceiledUpper))

      return { x, y, date, value }
    })

    // path
    const path = buildSmoothPath(itemCoordinates, { radius: 10 })
    
    // fill path
    const firstCoordinate = itemCoordinates[0]
    const lastCoordinate = itemCoordinates[itemCoordinates.length - 1]
    const fillPath = path + ` L ${lastCoordinate.x} ${BUFFER_Y + chartMaxHeight} L 0 ${BUFFER_Y + chartMaxHeight} L 0 ${firstCoordinate.y} Z`

    // circle
    const circles = itemCoordinates.map(({ x, y, value, date }) => {

      return (
        <CircleWrapper 
          value={value}
          date={date}
          OFFSET_X={OFFSET_X}
          subColor={subColor}
          popupColor={popupColor}
          borderLineColor={borderLineColor}
          circleColor={circleColor}
          x={x} 
          y={y}
          activeCoordinates$={this.activeCoordinates$}

          chartMaxHeight={chartMaxHeight}
          BUFFER_Y={BUFFER_Y}
        />
      )
    })

    // x axis
    const xAxis = [
      itemCoordinates[Math.max(chartData.length - 1 - (30 * 3), 0)],
      itemCoordinates[Math.max(chartData.length - 1 - (30 * 2), 0)],
      itemCoordinates[Math.max(chartData.length - 1 - (30 * 1), 0)],
      itemCoordinates[Math.max(chartData.length - 1 - (30 * 0), 0)],
    ].map((item) => {
      const date = item.date

      const title = `${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`

      const x = Math.min(
          Math.max(item.x - (26 / 2), 0),
          this.chartVisibleWidth$.value - 20
      )

      return (
        <text
          fill="#C5CADB"
          x={x}
          y={chartMaxHeight + BUFFER_Y + X_AXIS_VISIBLE_HEIGHT}
        >
          {title}
        </text>
      )
    })

    // y axis
    const yAxisOffset = (ceiledUpper / yAxisArr[yAxisArr.length - 1])
    const yAxis = yAxisArr.map((idx) => {

      const lastIdx = yAxisArr[yAxisArr.length - 1]

      const value = yAxisOffset * (lastIdx - idx)

      const y = BUFFER_Y + (chartMaxHeight / lastIdx) * idx

      const stroke = idx == lastIdx
        ? "#BBC5E3"
        : "#EEF1FC"
      
      const opacity = 0.5

      return (
        <>
          <line opacity={opacity} x1="0" x2={chartVisibleWidth} y1={y} y2={y} stroke={stroke} />
          <text 
            fill="#C5CADB"
            x={chartVisibleWidth + 20 - 10} 
            y={y}
          >
            {nFormatter(value, 0, currentLocale$.value)}
          </text>
        </>
      )
    })

    this.path$.next(path)
    this.filledPath$.next(fillPath)
    this.circles$.next(circles)
    this.xAxis$.next(xAxis)
    this.yAxis$.next(yAxis)
  }

  coordianteToString = () => {
    return `${this.activeCoordinates$.value.x}-${this.activeCoordinates$.value.y}`
  }

  getIngredients = () => {
    const { height = 300, chartMaxHeight = 160 } = this.props
    
    const X_AXIS_VISIBLE_HEIGHT = 22 - 3
    const BUFFER_Y = (height - chartMaxHeight) - X_AXIS_VISIBLE_HEIGHT

    return {
      height,
      chartMaxHeight,
      X_AXIS_VISIBLE_HEIGHT,
      BUFFER_Y,
    }
  }
    
  render() {
    const { 
      chartId, 
      strokeColor, 
      gradientColor,
    } = this.props

    const {
      height,
      chartMaxHeight,
      X_AXIS_VISIBLE_HEIGHT,
      BUFFER_Y,
    } = this.getIngredients()

    return (
      <div 
        id={`chart-${chartId}`}
        ref={(elem) => {
          if (!elem) return
          if (this.path$.value) return
          this.draw(elem, {
            height,
            chartMaxHeight,
            X_AXIS_VISIBLE_HEIGHT,
            BUFFER_Y,
          })
        }} 
        onMouseLeave={() => {
          this.activeCoordinates$.next({ x: null, y: null })
        }}
        className="Chart"
    >
        <svg height={height} key={this.coordianteToString()} ref={this.$svg}>
          {this.yAxis$.value}
          {this.xAxis$.value}
          <defs>
            <linearGradient id={chartId} x1="0%" y1="11.7%" x2="0%" y2="94.03%">
              <stop offset="0%" style={{ stopColor: gradientColor, stopOpacity: "0.5" }} />
              <stop offset="100%" style={{ stopColor: gradientColor, stopOpacity: "0.08" }} />
            </linearGradient>
          </defs>
          <path
            style={{
              opacity: .4
            }}
            stroke="none"
            fill={`url(#${chartId})`}
            d={this.filledPath$.value}
          />
          <path
            stroke={strokeColor}
            strokeWidth="2px"
            fill="none"
            d={this.path$.value}
          />
          {this.circles$.value}
        </svg>
      </div>
    )
  }
}

export default Chart