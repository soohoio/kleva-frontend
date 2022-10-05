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

const burnHistory = [
  { 
    date: "2022.05.26",
    burnedKLEVA: "277,430.37",
    burnedInUSD: "156,886.87",
    txid: "0x535e6893befd3be14b65385e261be91e8dd9df7044bf7b0a2faf3af8707fbea1",
  },
  { 
    date: "2022.05.27",
    burnedKLEVA: "98,328.03",
    burnedInUSD: "52,035.19",
    txid: "0x0e06f662fb82ec91eefbe45098040aeb975aff1f20dd8dbc79371122dfbd2f1b",
  },
  { 
    date: "2022.07.05",
    burnedKLEVA: "328,849.83",
    burnedInUSD: "52,813.28",
    txid: "0x72fd9bcec93702a213aa700224f6b0160ba96adfd8ef3e14399cf04a24715e94",
  },
  { 
    date: "2022.08.02",
    burnedKLEVA: "175,194.85",
    burnedInUSD: "45,988.65",
    txid: "0x702ac1507c8bfa50582dc2027f0ba74599fbd05efe0df82d52692c12d81b8fc4",
  },
  { 
    date: "2022.09.02",
    burnedKLEVA: "190,893.89",
    burnedInUSD: "34,723.60",
    txid: "0x5f95ddb24d5412365c4ec1084aca496f52d3def1002a748de10625e5a3f3b6f2",
  },
  { 
    date: "2022.10.05",
    burnedKLEVA: "382,401.78",
    burnedInUSD: "50,782.96",
    txid: "0xb33d6d91dbabba5d08007fb3c10219b4273f3f20a8b8b3cd6132d72742a7cc2c",
  },
].reverse()

class BurnHistoryModal extends Component {
  bloc = new Bloc(this)

  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      prevLocation$,
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