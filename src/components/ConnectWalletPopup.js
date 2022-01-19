import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import './ConnectWalletPopup.scss'
import Modal from './common/Modal'
import { connectInjected, logout$, selectedAddress$ } from '../streams/wallet'
import { closeModal$, isDesktop$ } from '../streams/ui'
import { accessKlip$ } from '../streams/klip'
import { walletType$ } from '../streams/setting'

const WalletConnectOption = ({ title, className, imgSrc, onClick }) => {
  return (
    <div onClick={onClick} className={cx("WalletConnectOption", className)}>
      <img className="WalletConnectOption__image" src={imgSrc} />
      <p className="WalletConnectOption__title">{title}</p>
    </div>
  )
}
class ConnectWalletPopup extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      selectedAddress$,
    ).pipe(
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
        title={selectedAddress$.value 
          ? "My Wallet"
          : "Connect Wallet"
        }
      >
        {selectedAddress$.value 
          ? (
            <div className="ConnectWalletPopup__connectedInfo">
              <p className="ConnectWalletPopup__connectedAs">Connected as: <span>{selectedAddress$.value}</span></p>
              <button 
                onClick={() => {
                  logout$.next(true)
                  closeModal$.next(true)
                }}
                className="ConnectWalletPopup__disconnectButton"
              >
                Disconnect
              </button>
            </div>
          )
          : (
            <div className="ConnectWalletPopup__items">
              <WalletConnectOption
                title="DCENT"
                className="WalletConnectOption--dcent"
                imgSrc="/static/images/logo-dcent.svg"
                onClick={() => {
                  if (window.klaytn) {
                    connectInjected()
                    return
                  }
                  const _url = encodeURIComponent(window.location.href)
                  const network = 'klaytn-mainnet'
                  const DEEP_LINKING_DCENT = "https://link.dcentwallet.com/DAppBrowser/?url=" + _url + "&network=" + network
                  window.open(DEEP_LINKING_DCENT)
                }}
              />
              <WalletConnectOption
                title="Kaikas"
                className="WalletConnectOption--kaikas"
                imgSrc="/static/images/wallet-option-kaikas.svg"
                onClick={() => {
                  connectInjected()
                  closeModal$.next(true)
                }}
              />
              <WalletConnectOption
                title="Klip"
                className="WalletConnectOption--klip"
                imgSrc="/static/images/wallet-option-klip.svg"
                onClick={() => {
                  accessKlip$.subscribe((result) => {
                    walletType$.next("klip")
                    selectedAddress$.next(result && result.klaytn_address)

                    if (!isMobile) {
                      closeModal$.next(true)
                    }
                  })
                }}
              />
              <WalletConnectOption
                title="Metamask"
                className="WalletConnectOption--metamask"
                imgSrc="/static/images/wallet-option-metamask.png"
                onClick={() => {
                  connectInjected('metamask')
                  closeModal$.next(true)
                }}
              />
            </div>
          )
        }
      </Modal>
    )
  }
}

export default ConnectWalletPopup