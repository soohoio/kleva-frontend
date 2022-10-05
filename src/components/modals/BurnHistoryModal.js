import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import { I18n } from 'components/common/I18n'


import Bloc from './BurnHistoryModal.bloc'
import './BurnHistoryModal.scss'
import { getQS } from '../../utils/misc'
import { currentTab$ } from '../../streams/view'
import { prevLocation$ } from '../../streams/location'
import { closeModal$ } from '../../streams/ui'
import { burnHistoryData$ } from '../../streams/chart'

class BurnHistoryModal extends Component {
  bloc = new Bloc(this)

  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      prevLocation$,
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
    
    const burnHistory = burnHistoryData$.value?.data

    return (
      <div className="BurnHistoryModal">
        <div className="BurnHistoryModalHeader">
          <p className="BurnHistoryModalHeader__title">
            {I18n.t('burnHistory')}
            <img
              onClick={() => {
                closeModal$.next(true)
              }}
              className="BurnHistoryModalHeader__close"
              src="/static/images/exported/x.svg?date=20220929"
            />
          </p>
        </div>
        <div className="BurnHistoryModal__content">
          <div className="BurnHistoryModal__gridHeader">
            <div className="BurnHistoryModal__header-date">{I18n.t('date')}</div>
            <div className="BurnHistoryModal__header-burnAmount">{I18n.t('burnAmount')}</div>
            <div className="BurnHistoryModal__header-detail">{I18n.t('detail')}</div>
            <div className="BurnHistoryModal__header-tx">Tx</div>
          </div>
          {burnHistory.map(({ date, burnedKLEVA, burnedInUSD, txid }) => {
            return (
              <div className="BurnHistoryModal__gridContentItem">
                <div className="BurnHistoryModal__date">{date}</div>
                <div className="BurnHistoryModal__burnAmount">{burnedKLEVA}</div>
                <div className="BurnHistoryModal__detail">{I18n.t('burn')}</div>
                <div
                  onClick={() => window.open(`https://scope.klaytn.com/tx/${txid}`)}
                  className="BurnHistoryModal__tx"
                >
                  {I18n.t('seeTx')}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
}

export default BurnHistoryModal