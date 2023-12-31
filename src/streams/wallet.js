import React from 'react'
import { from, BehaviorSubject, Subject, of } from 'rxjs'
import { distinctUntilChanged, filter, switchMap, windowTime } from 'rxjs/operators'
import ls from 'local-storage'
import { walletType$ } from './setting'

import { openModal$, closeModal$, openLayeredModal$ } from 'streams/ui'
import CompletedModal from '../components/common/CompletedModal'
import { I18n } from '../components/common/I18n'
import { closeLayeredModal$ } from './ui'
import DeepLinker from '../utils/deeplink'
import { getKNSName$ } from './contract'

export const selectedAddress$ = new BehaviorSubject()

export const knsDomain$ = new BehaviorSubject()

export const logout$ = new Subject()

export const walletProviderName$ = new BehaviorSubject()

// KNS
selectedAddress$.pipe(
  switchMap((address) => {
    if (address) {
      return getKNSName$(address)
    }

    return of('')
  })
).subscribe((knsDomain) => {
  knsDomain$.next(knsDomain)
})

window.knsDomain$ = knsDomain$

export const connectInjected = (injectedType, walletProviderName) => {

  walletProviderName$.next(walletProviderName)

  if (injectedType === "metamask") {
    const isNotInstalled = !window.isMobile && !window.ethereum
    const needToUseDeeplink = window.isMobile && !window.ethereum
    const notKlaytnNetwork = window.ethereum && (window.ethereum.networkVersion !== "8217")
    if (isNotInstalled) {
      openLayeredModal$.next({
        component: (
          <CompletedModal
            menus={[
              {
                title: I18n.t('metamask.install'),
                onClick: () => {
                  window.open("https://metamask.io/download/")
                  closeLayeredModal$.next(true)
                }
              },
              {
                title: I18n.t('doLater'),
                onClick: () => {
                  closeLayeredModal$.next(true)
                }
              },
            ]}
          >
            <p className="CompletedModal__title">{I18n.t('metamask.notInstalled')}</p>
            <p className="CompletedModal__description">{I18n.t('metamask.notInstalled.description')}</p>
          </CompletedModal>
        )
      })
      return false
    }

    if (needToUseDeeplink) {
      redirectApp({
        href: `dapp://${window.location.host}${window.location.pathname}`,
        androidStoreURL: "https://play.google.com/store/apps/details?id=io.metamask",
        iosStoreURL: "https://apps.apple.com/us/app/metamask-blockchain-wallet/id1438144202",
      })
    }

    if (notKlaytnNetwork) {
      openLayeredModal$.next({
        component: (
          <CompletedModal 
            menus={[
              {
                title: I18n.t('viewDetail'),
                onClick: () => {
                  window.open("https://medium.com/@KLEVA_Protocol_official/kleva-protocol-integrates-metamask-b2f4ddd9b0c6")
                  closeLayeredModal$.next(true)
                }
              },
              {
                title: I18n.t('doLater'),
                onClick: () => {
                  closeLayeredModal$.next(true)
                }
              },
            ]}
          >
            <p className="CompletedModal__title">{I18n.t('changeNetwork.title')}</p>
            <p className="CompletedModal__description">{I18n.t('changeNetwork.description')}</p>
          </CompletedModal>
        )
      })
      // alert('Please change network to Klaytn.')
      return false
    }

    window.injected = window.ethereum
  } else {
    if (injectedType === "kaikas") {
      const isNotInstalled = !window.isMobile && !window.klaytn
      if (isNotInstalled) {
        openLayeredModal$.next({
          component: (
            <CompletedModal
              menus={[
                {
                  title: I18n.t('kaikas.install'),
                  onClick: () => {
                    window.open("https://chrome.google.com/webstore/detail/kaikas/jblndlipeogpafnldhgmapagcccfchpi")
                    closeLayeredModal$.next(true)
                  }
                },
                {
                  title: I18n.t('doLater'),
                  onClick: () => {
                    closeLayeredModal$.next(true)
                  }
                },
              ]}
            >
              <p className="CompletedModal__title">{I18n.t('kaikas.notInstalled')}</p>
              <p className="CompletedModal__description">{I18n.t('kaikas.notInstalled.description')}</p>
            </CompletedModal>
          )
        })
        return false
      }
    }

    window.injected = window.klaytn
  }

  if (window.injected) {

    from(window.injected.enable()).subscribe(([selectedAddress]) => {
      selectedAddress$.next(selectedAddress)
      walletType$.next("injected")

      window.injected = window.injected
    })

    window.injected.on('accountsChanged', function (accounts) {
      selectedAddress$.next(accounts[0])

      window.injected = window.injected
      // Your code
    })

    window.injected.on('chainChanged', function (accounts) {
      window.location.reload()
    })

    // @IMPORTANT
    // returning true means it succeded to connect to the wallet.
    return true
  }
}

export const balancesInWallet$ = new BehaviorSubject({}) 
export const balancesInStakingPool$ = new BehaviorSubject({}) 
export const allowancesInLendingPool$ = new BehaviorSubject({})
export const allowancesInStakingPool$ = new BehaviorSubject({})
export const earned$ = new BehaviorSubject({})
export const depositedAt$ = new BehaviorSubject({})
export const fetchWalletInfo$ = new Subject()
export const pendingGT$ = new BehaviorSubject({})

export const lockedKlevaAmount$ = new BehaviorSubject(0)
export const unlockableKlevaAmount$ = new BehaviorSubject(0)
export const fetchUnlockAmount$ = new Subject()

logout$.subscribe(() => {
  balancesInWallet$.next({})
  balancesInStakingPool$.next({})
  allowancesInLendingPool$.next({})
  allowancesInStakingPool$.next({})
  earned$.next({})
  depositedAt$.next({})
  fetchWalletInfo$.next(true)
  selectedAddress$.next(null)
  pendingGT$.next({})

  walletProviderName$.next('')
})

window.selectedAddress$ = selectedAddress$
window.balancesInWallet$ = balancesInWallet$
window.balancesInStakingPool$ = balancesInStakingPool$

window.allowancesInLendingPool$ = allowancesInLendingPool$


export const redirectApp = ({
  href,
  androidStoreURL,
  iosStoreURL,
}) => {
  exeDeepLink(href);
  checkInstallApp({ androidStoreURL, iosStoreURL });
};

function checkInstallApp({ androidStoreURL, iosStoreURL }) {
  function clearTimers() {
    clearInterval(check);
    clearTimeout(timer);
  }

  function isHideWeb() {
    if (document.webkitHidden || document.hidden) {
      clearTimers();
    }
  }
  const check = setInterval(isHideWeb, 200);

  const timer = setTimeout(function () {
    redirectStore({ androidStoreURL, iosStoreURL });
  }, 2000);
}

export const redirectStore = ({ androidStoreURL, iosStoreURL }) => {
  const ua = navigator.userAgent.toLowerCase();

  window.location.href =
      ua.indexOf("android") > -1
      ? androidStoreURL
      : iosStoreURL
};

function exeDeepLink(href) {
  window.location.href = href
}