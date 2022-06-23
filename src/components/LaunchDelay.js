import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import './LaunchDelay.scss'
import Modal from './common/Modal'
import { closeModal$ } from '../streams/ui'

class LaunchDelay extends Component {

  destroy$ = new Subject()

  componentDidMount() {

  }

  componentWillUnmount() {
    this.destroy$.next(true)
  }

  render() {

    return (
      <Modal className="LaunchDelay">
        <p className="LaunchDelay__description">
          Hello KLEVARs, <br /><br />
          KLEVA Team has announced earlier that KLEVA Protocol is to launch today at 18:00 SGT.<br />
          In actuality, Launch is based on block number, and may differ from actual time. <br /><br />
          Klaytn mainnet has experienced a short delay in block generation in the past two days,<br />
          and thus block number has also been delayed, respectively. <br /><br />
          Due to the delay, we regret to announce that the launch of KLEVA Protocol will have to be postponed by approximately 20 minutes.<br />
          KLEVA Team appreciates all KLEVARs’ kind understanding for this deferment. <br /><br />
          Additionally, KLEVA Protocol Launch Count Down on https://kleva.io has been altered to be based on block number.<br />
          Please refer to the block number countdown for actual KLEVA Protocol Launch. <br /><br />
          Sincerely yours,<br />
          KLEVA Team
        </p>
        <button onClick={() => closeModal$.next(true)} className="LaunchDelay__okButton">OK</button>
      </Modal>
    )
  }
}

export default LaunchDelay