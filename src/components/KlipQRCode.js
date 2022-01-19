import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'
import QRCode from 'qrcode'
import { closeModal$ } from 'streams/ui'

import './KlipQRCode.scss'
import Modal from './common/Modal'

class KlipQRCode extends Component {
  $qrcode = createRef()

  destroy$ = new Subject()

  componentDidMount() {
    const { request_key } = this.props
    this.renderQRCode(request_key)
  }

  componentWillUnmount() {
    this.destroy$.next(true)
  }

  renderQRCode = (request_key) => {
    const { observer } = this.props
    const url = `https://klipwallet.com/?target=/a2a?request_key=${request_key}`

    QRCode.toCanvas(this.$qrcode.current, url, function (error) {
      if (error) console.error(error)
      observer.next(true)
    })
  }

  render() {
    const { request_key } = this.props

    return (
      <Modal
        className="KlipQRCode"
        title="Connect Kakao Klip"
      >
        <canvas ref={this.$qrcode} className="KlipQRCode__QR" />
        <p className="KlipQRCode__QRDescription">
          Scan the QR code through a QR code reader <br /> or KakaoTalk App > Search > Code Scan
        </p>

      </Modal>
    )
  }
}

export default KlipQRCode