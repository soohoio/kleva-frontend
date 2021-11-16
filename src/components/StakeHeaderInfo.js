import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import GTEarned from 'components/GTEarned'
import GTWalletBalance from 'components/GTWalletBalance'

import './StakeHeaderInfo.scss'

class StakeHeaderInfo extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    
  }
  
  componentWillUnMount() {
    this.destroy$.next(true)
  }
    
  render() {
    
    return (
      <div className="StakeHeaderInfo">
        <GTEarned />
        <GTWalletBalance />
      </div>
    )
  }
}

export default StakeHeaderInfo