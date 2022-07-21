import { from, BehaviorSubject, Subject } from 'rxjs'
import { distinctUntilChanged, filter, windowTime } from 'rxjs/operators'
import ls from 'local-storage'
import { walletType$ } from './setting'

import { closeModal$ } from 'streams/ui'

export const selectedAddress$ = new BehaviorSubject("0xA98A1125c73030513379F6523dC6F9e6d9b5c769")

export const logout$ = new Subject()

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

export const connectInjected = (injectedType) => {

  if (injectedType === "metamask") {
    if (!window.ethereum) {
      alert('Please install Metamask first.')
      return
    }

    if (window.ethereum.networkVersion !== "8217") {
      alert('Please change network to Klaytn.')
      return
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
})

window.selectedAddress$ = selectedAddress$
window.balancesInWallet$ = balancesInWallet$
window.balancesInStakingPool$ = balancesInStakingPool$

window.allowancesInLendingPool$ = allowancesInLendingPool$


