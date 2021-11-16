import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'
import QRCode from 'qrcode'

import { closeModal$ } from 'streams/ui'

import './KlipQRCode.scss'

const FooterItem = ({ title, iconSrc }) => {
  return (
    <div className="KlipQRCodeFooterItem">
      <img className="KlipQRCodeFooterItem__icon" src={iconSrc} />
      <p className="KlipQRCodeFooterItem__title">{title}</p>
    </div>
  )
}

class KlipQRCode extends Component {
  $qrcode = createRef()

  destroy$ = new Subject()

  componentDidMount() {
    const { request_key } = this.props
    this.renderQRCode(request_key)
  }

  componentWillUnMount() {
    this.destroy$.next(true)
  }

  renderQRCode = (request_key) => {
    const { observer } = this.props
    console.log(request_key, 'request_key')
    const url = `https://klipwallet.com/?target=/a2a?request_key=${request_key}`

    QRCode.toCanvas(this.$qrcode.current, url, function (error) {
      if (error) console.error(error)
      console.log('success!')
      observer.next(true)
    })
  }

  render() {
    const { request_key } = this.props

    return (
      <div className="KlipQRCode">
        <div className="KlipQRCode__content">
          <div className="KlipQRCode__contentHeader">
            {/* <img className="KlipQRCode__prev" src="/static/images/18-line-arr-left.svg" /> */}
            <div className="KlipQRCode__contentHeaderTitle">
              <img className="KlipQRCode__klipLogo" src="/static/images/ic-service-klip-bk.svg" />
              Connect Klip via Kakao
            </div>
            <img onClick={() => closeModal$.next(true)} className="KlipQRCode__close" src="/static/images/18-line-x.svg" />
          </div>
          <canvas ref={this.$qrcode} className="KlipQRCode__QR" />
          <p className="KlipQRCode__QRDescription">Scan QR code with camera app or KakaoTalk code scan</p>
        </div>
        <div className="KlipQRCode__footer">
          <FooterItem title="Scan with Camera app" iconSrc="/static/images/ic-camera.png" />
          <div className="KlipQRCode__footerLiner" />
          <FooterItem title="Run KakaoTalk" iconSrc="/static/images/ic-kakaotalk-logo@3x.png" />
          <img className="KlipQRCode__next" src="/static/images/18-line-arr-right.svg" />
          <FooterItem title="Tab Search icon" iconSrc="/static/images/ic-kakaotalk-search@3x.png" />
          <img className="KlipQRCode__next" src="/static/images/18-line-arr-right.svg" />
          <FooterItem title="Scan QR & login" iconSrc="/static/images/ic-kakaotalk-scan@3x.png" />
        </div>
        <img className="KlipQRCode__logo" src="/static/images/" />
      </div>
    )
  }
}

export default KlipQRCode