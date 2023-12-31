import React, { Component, Fragment, createRef } from 'react'
import BigNumber from 'bignumber.js'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import Bloc from './TotalSupplyInfo.bloc'
import './TotalSupplyInfo.scss'
import { I18n } from '../common/I18n'
import { noRounding } from '../../utils/misc'
import LabelAndValue from '../LabelAndValue'
import QuestionMark from '../common/QuestionMark'
import { openModal$, openLayeredModal$ } from '../../streams/ui'
import LockupInfoModal from '../modals/LockupInfoModal'
import { tokenList } from '../../constants/tokens'
import { tokenPrices$ } from '../../streams/tokenPrice'
import BurnHistoryModal from '../modals/BurnHistoryModal'
import { burnHistoryData$ } from '../../streams/chart'

class TotalSupplyInfo extends Component {
  bloc = new Bloc(this)

  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      tokenPrices$,
      burnHistoryData$,
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
      totalTVLData,
      klevaCirculationData,
      klevaLockedData,
      klevaTotalSupplyData,
      klevaBuybackburnFundData,
      klevaBurnData,
    } = this.props

    const lastUpdatedDate = totalTVLData[totalTVLData.length - 1] && totalTVLData[totalTVLData.length - 1].date
    const updatedAt = lastUpdatedDate && lastUpdatedDate.getFullYear()
      + "."
      + String(lastUpdatedDate.getMonth() + 1).padStart(2, "0")
      + "."
      + String(lastUpdatedDate.getDate()).padStart(2, "0")
      + ". "
      + String(lastUpdatedDate.getHours()).padStart(2, "0")
      + ":"
      + String(lastUpdatedDate.getMinutes()).padStart(2, "0")

    const totalSupply = klevaTotalSupplyData[klevaTotalSupplyData.length - 1]?.value
    const klevaCirculation = klevaCirculationData[klevaCirculationData.length - 1]?.value
    const klevaPlatformLocked = klevaLockedData[klevaLockedData.length - 1]?.value

    const accumBurnAmount = klevaBurnData[klevaBurnData.length - 1]?.value
    // const accumBuybackInUSD = 393231 // 2022.10.05
    const accumBuybackInUSD = burnHistoryData$.value?.accumValue
    
    const klevaLockedPure = klevaPlatformLocked - accumBurnAmount

    const marketCap = new BigNumber(klevaCirculation)
      .plus(klevaLockedPure)
      .multipliedBy(tokenPrices$.value[tokenList.KLEVA.address.toLowerCase()])
      .toNumber()
    
    const circulationPercentage = klevaCirculation / totalSupply
    const lockupPercentage = klevaLockedPure / totalSupply
    const burnPercentage = accumBurnAmount / totalSupply

    return (
      <div className="TotalSupplyInfo">
        <div className="TotalSupplyInfo__title">
          <img src="/static/images/exported/logo-kleva-2.svg?date=20220929" />
          <span>{I18n.t('dashboard.totalSupply.title')}</span>
        </div>
        <p className="TotalSupplyInfo__supply">
          <strong>{noRounding(totalSupply, 0)}</strong>
          <span>KLEVA</span>
        </p>
        <p className="TotalSupplyInfo__marketcap">{I18n.t('dashboard.marketCap.title')} ${noRounding(marketCap, 0)}</p>
        <p className="TotalSupplyInfo__lastSync">{I18n.t('lastSync', { date: updatedAt })}</p>

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
          value={`${noRounding(klevaCirculation)}`}
        />
        <LabelAndValue 
          className="TotalSupplyInfo__lockup"
          label={(
            <>
              <span>
                {I18n.t('dashboard.lockup.title')}
                <QuestionMark
                  onClick={() => {
                    openModal$.next({
                      component: <LockupInfoModal />
                    })
                  }}
                />
              </span>
              <span>{Number(lockupPercentage * 100).toFixed(1)}%</span>
            </>
          )}
          value={`${noRounding(klevaLockedPure)}`}
        />
        <LabelAndValue 
          className="TotalSupplyInfo__burn"
          label={(
            <>
              <span>{I18n.t('dashboard.burn.title')}</span>
              <span>{Number(burnPercentage * 100).toFixed(1)}%</span>
            </>
          )}
          value={`${noRounding(accumBurnAmount)}`}
        />
        <hr className="TotalSupplyInfo__hr" />
        <LabelAndValue
          className="TotalSupplyInfo__accumBuybackInUSD"
          label={I18n.t('dashboard.accumBuybackValue.title')}
          value={`$${noRounding(accumBuybackInUSD, 0)}`}
        />
        <button
          onClick={() => {
            openModal$.next({
              classNameAttach: "Modal--mobileCoverAll",
              component: <BurnHistoryModal />
            })
          }}
          className="TotalSupplyInfo__see"
        >
          {I18n.t('dashboard.accumBurnAmount.view')}
        </button>
      </div>
    )
  }
}

export default TotalSupplyInfo