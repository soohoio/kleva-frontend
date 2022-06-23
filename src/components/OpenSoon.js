import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import './OpenSoon.scss'
import Modal from './common/Modal'
import { closeModal$ } from '../streams/ui'

class OpenSoon extends Component {

  destroy$ = new Subject()
  
  componentDidMount() {
    
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }
    
  render() {
    
    return (
      <Modal className="OpenSoon">
        <p className="OpenSoon__description">Farming pools will open soon!</p>
        <button onClick={() => closeModal$.next(true)} className="OpenSoon__okButton">OK</button>
      </Modal>
    )
  }
}

export default OpenSoon