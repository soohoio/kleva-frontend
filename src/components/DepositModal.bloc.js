import { BehaviorSubject } from "rxjs"
import { switchMap, tap } from 'rxjs/operators'
import BigNumber from 'bignumber.js'

import { approve$, depositForLending$, getTransactionReceipt$ } from "../streams/contract"
import { MAX_UINT } from 'constants/setting'
import { fetchWalletInfo$ } from "../streams/wallet"
import { closeModal$ } from "../streams/ui"

export default class {
  constructor() {
    this.depositAmount$ = new BehaviorSubject('')
    this.isLoading$ = new BehaviorSubject(false)
  }

  handleChange = (e) => {
    this.depositAmount$.next(e.target.value)
  }

  approve = (stakingToken, vaultAddress) => {
    approve$(stakingToken.address, vaultAddress, MAX_UINT).pipe(
      tap(() => this.isLoading$.next(true)),
      switchMap((result) => getTransactionReceipt$(result && result.result || result.tx_hash))
    ).subscribe((result) => {
      this.isLoading$.next(false)
      fetchWalletInfo$.next(true)
    })
  }

  deposit = (stakingToken, vaultAddress) => {
    const depositAmount = new BigNumber(this.depositAmount$.value).multipliedBy(10 ** stakingToken.decimals).toString()
    
    const nativeCoinAmount = stakingToken.nativeCoin
    ? depositAmount
    : 0

    depositForLending$(vaultAddress, depositAmount, nativeCoinAmount).pipe(
      tap(() => this.isLoading$.next(true)),
      switchMap((result) => {
        return getTransactionReceipt$(result && result.result || result.tx_hash)
      })
    ).subscribe((result) => {
      this.isLoading$.next(false)
      fetchWalletInfo$.next(true)
      closeModal$.next(true)
    })
  }
}