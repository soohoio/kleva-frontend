import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import './LeverageController.scss'

class LeverageController extends Component {
  destroy$ = new Subject()
  
  state = {
    leverage: 1,
  }

  componentDidMount() {
    
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }
    
  render() {
    const { className, currentLeverage, setLeverage, leverageLabel, offset } = this.props
    
    return (
      <div className={cx("LeverageController", className)}>
        {/* <span className="LeverageController__title">Leverage</span> */}
        <div className="LeverageController__content">
          <img 
            className="LeverageController__minusIcon" 
            src="/static/images/minus.svg?date=20220929" 
            onClick={() => setLeverage(currentLeverage - offset)}
          />
          <span className="LeverageController__leverageValue">{currentLeverage}{leverageLabel}</span>
          <img 
            className="LeverageController__plusIcon" 
            src="/static/images/plus.svg?date=20220929" 
            onClick={() => setLeverage(currentLeverage + offset)}
          />
        </div>
      </div>
    )
  }
}

export default LeverageController