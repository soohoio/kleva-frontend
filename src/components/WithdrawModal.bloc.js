import { BehaviorSubject } from "rxjs"
import BigNumber from 'bignumber.js'

import { getTransactionReceipt$, unwrapWKLAY$, withdrawFromLending$ } from "../streams/contract"
import { switchMap, tap } from "rxjs/operators"
import { closeModal$ } from "../streams/ui"
import { fetchWalletInfo$ } from "../streams/wallet"
import { tokenList } from "../constants/tokens"

export default class {
  constructor() {
    this.isLoading$ = new BehaviorSubject(false)
    this.withdrawAmount$ = new BehaviorSubject('')
    this.isUnwrapping$ = new BehaviorSubject(false)
    this.klayAmountToUnwrap$ = new BehaviorSubject('')
  }

  handleChange = (e) => {
    this.withdrawAmount$.next(e.target.value)
  }

  withdraw = (stakingToken, vaultAddress) => {

    const withdrawAmount = new BigNumber(this.withdrawAmount$.value)
      .multipliedBy(10 ** stakingToken.decimals)
      .toString()

    withdrawFromLending$(vaultAddress, withdrawAmount).pipe(
      tap(() => this.isLoading$.next(true)),
      switchMap((result) => getTransactionReceipt$(result && result.result || result.tx_hash))
    ).subscribe((result) => {
      this.isLoading$.next(false)
      fetchWalletInfo$.next(true)

      if (stakingToken.address == tokenList.KLAY.address) {
        closeModal$.next(true)
      }
    })
  }

  unwrapWKLAY = () => {

    const unwrapAmount = new BigNumber(this.klayAmountToUnwrap$.value)
      .multipliedBy(10 ** 18)
      .toString()

    unwrapWKLAY$(unwrapAmount).pipe(
      tap(() => this.isUnwrapping$.next(true)),
      switchMap((result) => getTransactionReceipt$(result && result.result || result.tx_hash))
    ).subscribe(() => {
      this.klayAmountToUnwrap$.next('')
      this.isUnwrapping$.next(false)
      fetchWalletInfo$.next(true)

      closeModal$.next(true)
    })
  }
}