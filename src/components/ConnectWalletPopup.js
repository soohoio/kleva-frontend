import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { debounceTime, takeUntil, tap } from 'rxjs/operators'

import './ConnectWalletPopup.scss'
import Modal from './common/Modal'
import { I18n } from './common/I18n'
import { connectInjected, logout$, selectedAddress$, walletProviderName$, redirectApp } from '../streams/wallet'
import { closeModal$, isDesktop$ } from '../streams/ui'
import { accessKlip$ } from '../streams/klip'
import { walletType$ } from '../streams/setting'

const WalletConnectOption = ({ title, className, imgSrc, onClick }) => {
  return (
    <div onClick={onClick} className={cx("WalletConnectOption", className)}>
      <img className="WalletConnectOption__image" src={imgSrc} />
      <p className="WalletConnectOption__title">{I18n.t('connectWallet.connectWith', {
        title
      })}
    </p>
    </div>
  )
}
class ConnectWalletPopup extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      selectedAddress$,
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
      <Modal 
        layered={this.props.layered}
        className="ConnectWalletPopup"
        title={I18n.t('connectWallet.title')}
      >
        <div className="ConnectWalletPopup__items">
          <WalletConnectOption
            title="DCENT"
            className="WalletConnectOption--dcent"
            imgSrc="/static/images/logo-dcent.svg?date=20220929"
            onClick={() => {

              if (window.klaytn && window.klaytn.isDcentWallet) {
                connectInjected('', 'decent')
                closeModal$.next(true)
                return
              }

              const _url = encodeURIComponent(window.location.href)
              const network = 'klaytn-mainnet'
              const DEEP_LINKING_DCENT = "https://link.dcentwallet.com/DAppBrowser/?url=" + _url + "&network=" + network
              window.open(DEEP_LINKING_DCENT)
              closeModal$.next(true)
            }}
          />
          <WalletConnectOption
            title="Kaikas"
            className={cx("WalletConnectOption--kaikas", {
              "WalletConnectOption--kaikas-mobile": window.isMobile,
            })}
            imgSrc="/static/images/wallet-option-kaikas.svg?date=20220929"
            onClick={() => {

              const needToUseDeeplink = window.isMobile && !window.klaytn

              if (needToUseDeeplink) {
                redirectApp({
                  href: "kaikas://wallet/browser?url=" + encodeURIComponent(window.location.protocol + "//" + window.location.host + window.location.pathname),
                  androidStoreURL: "https://play.google.com/store/apps/details?id=io.klutch.wallet",
                  iosStoreURL: "https://itunes.apple.com/app/id1626107061",
                })
                return
              }

              if (connectInjected('kaikas', 'Kaikas')) {
                closeModal$.next(true)
              }
            }}
          />
          <WalletConnectOption
            title="Klip"
            className="WalletConnectOption--klip"
            imgSrc="/static/images/wallet-option-klip.svg?date=20220929"
            onClick={() => {
              accessKlip$().subscribe((result) => {
                walletType$.next("klip")
                selectedAddress$.next(result && result.klaytn_address)
                walletProviderName$.next('Klip')
                closeModal$.next(true)
              })
            }}
          />
          <WalletConnectOption
            title="Metamask"
            className="WalletConnectOption--metamask"
            imgSrc="/static/images/common/icon_wallet_metamask.svg?date=20220929"
            onClick={() => {
              if (connectInjected('metamask', 'Metamask')) {
                closeModal$.next(true)
              }
            }}
          />
        </div>

        <div className="ConnectWalletPopup__noWalletGuide">
          <p className="ConnectWalletPopup__noWalletTitle">{I18n.t('connectWallet.noWallet.title')}</p>
          <p className="ConnectWalletPopup__noWalletDescription">{I18n.t('connectWallet.noWallet.description')}</p>

          <p 
            className="ConnectWalletPopup__makeWallet ConnectWalletPopup__makeWallet--dcent"
            onClick={() => {
              window.open('https://dcentwallet.com')
            }}
          >
            {I18n.t('connectWallet.makeWallet', {
              title: 'D`CENT'
            })}
          </p>
          <p
            className="ConnectWalletPopup__makeWallet ConnectWalletPopup__makeWallet--kaikas"
            onClick={() => {
              window.open('https://chrome.google.com/webstore/detail/kaikas/jblndlipeogpafnldhgmapagcccfchpi')
            }}
          >
            {I18n.t('connectWallet.makeWallet', {
              title: 'Kaikas'
            })}
          </p>
          <p
            className="ConnectWalletPopup__makeWallet"
            onClick={() => {
              window.open('https://www.kakaocorp.com/page/service/service/Klip')
            }}
          >
            {I18n.t('connectWallet.makeWallet', {
              title: 'Klip'
            })}
          </p>
          <p 
            className="ConnectWalletPopup__makeWallet"
            onClick={() => {
              window.open('https://metamask.io/')
            }}
          >
            {I18n.t('connectWallet.makeWallet', {
              title: 'Metamask'
            })}
          </p>
        </div>
      </Modal>
    )
  }
}

export default ConnectWalletPopup