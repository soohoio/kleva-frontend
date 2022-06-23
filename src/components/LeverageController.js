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
    const { currentLeverage, setLeverage, offset, leverageCap, leverageCapRaw } = this.props
    
    return (
      <div className="LeverageController">
        <span className="LeverageController__title">Leverage</span>
        <div className="LeverageController__content">
          <img 
            className="LeverageController__minusIcon" 
            src="/static/images/minus.svg" 
            onClick={() => setLeverage(currentLeverage - offset)}
          />
          <span className="LeverageController__leverageValue">{currentLeverage}</span>
          <img 
            className="LeverageController__plusIcon" 
            src="/static/images/plus.svg" 
            onClick={() => setLeverage(currentLeverage + offset)}
          />
        </div>
      </div>
    )
  }
}

export default LeverageController