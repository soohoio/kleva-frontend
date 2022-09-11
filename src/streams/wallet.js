import React from 'react'
import { from, BehaviorSubject, Subject } from 'rxjs'
import { distinctUntilChanged, filter, windowTime } from 'rxjs/operators'
import ls from 'local-storage'
import { walletType$ } from './setting'

import { openModal$, closeModal$ } from 'streams/ui'
import CompletedModal from '../components/common/CompletedModal'
import { I18n } from '../components/common/I18n'

export const selectedAddress$ = new BehaviorSubject()

export const logout$ = new Subject()

export const walletProviderName$ = new BehaviorSubject()

selectedAddress$.pipe(
  distinctUntilChanged()
).subscribe(() => {
  closeModal$.next(true)
})

selectedAddress$.pipe(
  // Only store selectedAddress$ in local storage only in Web environment.
  // + If the selected address is set with klip, don't store it on local storage.
  filter((a) => !!a && !isMobile && walletType$.value !== "klip"),
).subscribe((address) => {
  
})

export const connectInjected = (injectedType, walletProviderName) => {

  walletProviderName$.next(walletProviderName)

  if (injectedType === "metamask") {
    if (!window.isMobile && !window.ethereum) {
      alert('Please install Metamask first.')
      return false
    }

    if (window.isMobile && !window.ethereum) {
      document.location = `dapp://${window.location.host}${window.location.pathname}`;
      
      var time = (new Date()).getTime();
      setTimeout(function () {
        var now = (new Date()).getTime();

        if ((now - time) < 400) {
          document.location = `https://metamask.app.link/dapp/${window.location.host}`;
        }
      }, 300);
      window.open(`dapp://${window.location.host}${window.location.pathname}`)
      return false
    }

    if (window.ethereum.networkVersion !== "8217") {
      openModal$.next({
        component: (
          <CompletedModal 
            menus={[
              {
                title: I18n.t('viewDetail'),
                onClick: () => {
                  window.open("https://medium.com/@KLEVA_Protocol_official/kleva-protocol-integrates-metamask-b2f4ddd9b0c6")
                  closeModal$.next(true)
                }
              },
              {
                title: I18n.t('doLater'),
                onClick: () => {
                  closeModal$.next(true)
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


