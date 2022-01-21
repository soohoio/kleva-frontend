import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import './LockedKLEVAPopup.scss'
import Modal from './common/Modal'
import LockedKLEVA from './LockedKLEVA'

class LockedKLEVAPopup extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }
    
  render() {
    
    return (
      <Modal 
        className="LockedKLEVAPopup"
        title={(
          <>
            Locked KLEVA
            {/* <span className="LockedKLEVA__airdrop">Airdrop</span> */}
          </>
        )}
      >
        <LockedKLEVA contentOnly />
      </Modal>
    )
  }
}

export default LockedKLEVAPopup