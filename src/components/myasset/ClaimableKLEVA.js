import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import { I18n } from '../common/I18n'

import './ClaimableKLEVA.scss'
import { pendingGT$ } from '../../streams/wallet'
import { tokenList } from '../../constants/tokens'
import { tokenPrices$ } from '../../streams/tokenPrice'
import { nFormatter } from '../../utils/misc'
import { openModal$ } from '../../streams/ui'
import EarnedPopup from './EarnedPopup'

class ClaimableKLEVA extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      pendingGT$,
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

  getPendingAggregation = () => {
    const pendingReward = Object.values(pendingGT$.value).reduce((acc, cur) => {
      return new BigNumber(acc).plus(cur).toNumber()
    }, 0)

    const inUSD = new BigNumber(pendingReward)
      .div(10 ** tokenList.KLEVA.decimals)
      .multipliedBy(tokenPrices$.value[tokenList.KLEVA.address.toLowerCase()])
      .toNumber()

    return { pendingReward, inUSD }
  }
    
  render() {

    const { pendingReward, inUSD } = this.getPendingAggregation()

    const isDisabled = pendingReward == 0

    return (
      <div 
        className={cx("ClaimableKLEVA", {
          "ClaimableKLEVA--disabled": isDisabled,
        })}
      >
        <div className="ClaimableKLEVA__left">
          <p className="ClaimableKLEVA__title">{I18n.t('myasset.claimableKLEVA')}</p>
          <p className="ClaimableKLEVA__pendingReward">
            <span className="ClaimableKLEVA__pendingRewardValue">{nFormatter(new BigNumber(pendingReward).div(10 ** tokenList.KLEVA.decimals).toNumber(), 2)}</span>
            <span className="ClaimableKLEVA__pendingRewardInUSD">${nFormatter(inUSD, 2)}</span>
          </p>
        </div>
        <span 
          onClick={() => {
            if (isDisabled) return
            openModal$.next({
              component: <EarnedPopup />
            })
          }}
          className="ClaimableKLEVA__claim"
        >
          {I18n.t('claim')}
        </span>
      </div>
    )
  }
}

export default ClaimableKLEVA