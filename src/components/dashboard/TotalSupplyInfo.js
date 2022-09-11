import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import Bloc from './TotalSupplyInfo.bloc'
import './TotalSupplyInfo.scss'
import { I18n } from '../common/I18n'
import { noRounding } from '../../utils/misc'
import LabelAndValue from '../LabelAndValue'

class TotalSupplyInfo extends Component {
  bloc = new Bloc(this)

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
    
    const marketCap = 24283603
    const klevaCirculation = 29827092
    const klevaPlatformLocked = 9382298

    const accumBuybackInUSD = 2383390
    const accumBurnAmount = 4395840

    const totalSupply = klevaCirculation + klevaPlatformLocked + accumBurnAmount
    
    const circulationPercentage = klevaCirculation / totalSupply
    const lockupPercentage = klevaPlatformLocked / totalSupply
    const burnPercentage = accumBurnAmount / totalSupply

    return (
      <div className="TotalSupplyInfo">
        <div className="TotalSupplyInfo__title">
          <img src="/static/images/exported/logo-kleva-2.svg" />
          <span>{I18n.t('dashboard.totalSupply.title')}</span>
        </div>
        <p className="TotalSupplyInfo__supply">
          <strong>{noRounding(totalSupply, 0)}</strong>
          <span>KLEVA</span>
        </p>
        <p className="TotalSupplyInfo__marketcap">{I18n.t('dashboard.marketCap.title')} ${noRounding(marketCap, 0)}</p>

        <div className="TotalSupplyInfo__gauge">
          <div
            style={{ flex: `${circulationPercentage * 100}` }}
            className={cx("TotalSupplyInfo__gaugeItem", {
              [`TotalSupplyInfo__gaugeItem--circulation`]: true,
            })}
          />
          <div
            style={{ flex: `${lockupPercentage * 100}` }}
            className={cx("TotalSupplyInfo__gaugeItem", {
              [`TotalSupplyInfo__gaugeItem--lockup`]: true,
            })}
          />
          <div
            style={{ flex: `${burnPercentage * 100}` }}
            className={cx("TotalSupplyInfo__gaugeItem", {
              [`TotalSupplyInfo__gaugeItem--burn`]: true,
            })}
          />
        </div>

        <LabelAndValue
          className="TotalSupplyInfo__circulation"
          label={(
            <>
              <span>{I18n.t('dashboard.circulatingSupply.title')}</span>
              <span>{Number(circulationPercentage * 100).toFixed(1)}%</span>
            </>
          )}
          value={`${noRounding(klevaCirculation)} KLEVA`}
        />
        <LabelAndValue 
          className="TotalSupplyInfo__lockup"
          label={(
            <>
              <span>{I18n.t('dashboard.lockup.title')}</span>
              <span>{Number(lockupPercentage * 100).toFixed(1)}%</span>
            </>
          )}
          value={`${noRounding(klevaPlatformLocked)} KLEVA`}
        />
        <LabelAndValue 
          className="TotalSupplyInfo__burn"
          label={(
            <>
              <span>{I18n.t('dashboard.burn.title')}</span>
              <span>{Number(burnPercentage * 100).toFixed(1)}%</span>
            </>
          )}
          value={`${noRounding(accumBurnAmount)} KLEVA`}
        />
        <hr className="TotalSupplyInfo__hr" />
        <LabelAndValue
          className="TotalSupplyInfo__accumBuybackInUSD"
          label={I18n.t('dashboard.accumBuybackValue.title')}
          value={`$${noRounding(accumBuybackInUSD, 0)}`}
        />
        {/* <LabelAndValue
          className="TotalSupplyInfo__accumBurnAmount"
          label={I18n.t('dashboard.accumBurnAmount.title')}
          value={(
            <>
              <p>{noRounding(accumBurnAmount, 0)} KLEVA</p>
              <p>{I18n.t('dashboard.accumBurnAmount.description', { value: Number(burnPercentage * 100).toFixed(2) })}%</p>
            </>
          )}
        /> */}
        <button className="TotalSupplyInfo__see">
          {I18n.t('dashboard.accumBurnAmount.view')}
        </button>
      </div>
    )
  }
}

export default TotalSupplyInfo