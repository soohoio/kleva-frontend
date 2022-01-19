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
          Hello KLEVARs <br />
          KLEVA Team has announced earlier that KLEVA Protocol will launch on 18:00 SGT. The time was announced for your convenience - The Launch time is actually based on block number. <br /><br />
          In the past two days, the Cypress mainnet has been delayed by approximately 15 minutes; thus impacting the block number to be delayed by the equal duration. <br /><br />
          Therefore, although the pre-announced launch time of KLEVA Protocol is 18:00 SGT, the actual launch may be delayed approximately 15 to 20 minutes, based on Cypress network environment. <br /><br />
          KLEVA Team appreciates your kind understanding for this deferment, and would like to emphasize that the deferment does not rely upon internal issues of KLEVA Protocol, but rather issues related to Cypress Network. <br /><br />
          Sincerely, <br />
          KLEVA Team <br />
        </p>
        <button onClick={() => closeModal$.next(true)} className="LaunchDelay__okButton">OK</button>
      </Modal>
    )
  }
}

export default LaunchDelay