import { BehaviorSubject } from "rxjs"
import { switchMap } from 'rxjs/operators'
import BigNumber from 'bignumber.js'

import { approve$, depositForLending$, getTransactionReceipt$ } from "../streams/contract"
import { MAX_UINT } from 'constants/setting'
import { fetchWalletInfo$ } from "../streams/wallet"
import { closeModal$ } from "../streams/ui"

export default class {
  constructor() {
    this.depositAmount$ = new BehaviorSubject('')
  }

  handleChange = (e) => {
    this.depositAmount$.next(e.target.value)
  }

  approve = (stakingToken, vaultAddress) => {
    approve$(stakingToken.address, vaultAddress, MAX_UINT).pipe(
      switchMap((result) => getTransactionReceipt$(result && result.result))
    ).subscribe((result) => {
      console.log(result, 'approve result')
      fetchWalletInfo$.next(true)
    })
  }

  deposit = (stakingToken, vaultAddress) => {

    const depositAmount = new BigNumber(this.depositAmount$.value).multipliedBy(10 ** stakingToken.decimals).toString()

    const nativeCoinAmount = stakingToken.nativeCoin
      ? depositAmount
      : 0

    depositForLending$(vaultAddress, depositAmount, nativeCoinAmount).pipe(
      switchMap((result) => getTransactionReceipt$(result && result.result))
    ).subscribe((result) => {
      console.log(result, 'deposit result')
      fetchWalletInfo$.next(true)
      closeModal$.next(true)
    })
  }
}