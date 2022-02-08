
import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import './AssetInfo.scss'

class AssetInfo extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }
    
  render() {
    const { iconSrc, title, ibTokenPrice, onClick } = this.props

    console.log(ibTokenPrice, 'ibTokenPrice')

    return (
      <div onClick={onClick} className="AssetInfo">
        <img className="AssetInfo__icon" src={iconSrc} />
        <div className="AssetInfo__info">
          <p className="AssetInfo__title">{title}</p>
          <p className="AssetInfo__priceInfo">
            1 ib{title}
            {/* = {Number(ibTokenPrice).toLocaleString('en-us', { maximumFractionDigits: 18 })} {title} */}
            = {ibTokenPrice} {title}
          </p>
        </div>
      </div>
    )
  }
}

export default AssetInfo