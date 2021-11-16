import { BehaviorSubject } from "rxjs"
import BigNumber from 'bignumber.js'

import { getTransactionReceipt$, withdrawFromLending$ } from "../streams/contract"
import { switchMap } from "rxjs/operators"
import { closeModal$ } from "../streams/ui"
import { fetchWalletInfo$ } from "../streams/wallet"

export default class {
  constructor() {
    this.withdrawAmount$ = new BehaviorSubject('')
  }

  handleChange = (e) => {
    this.withdrawAmount$.next(e.target.value)
  }

  withdraw = (stakingToken, vaultAddress) => {
    const withdrawAmount = new BigNumber(this.withdrawAmount$.value).multipliedBy(10 ** stakingToken.decimals).toString()

    withdrawFromLending$(vaultAddress, withdrawAmount).pipe(
      switchMap((result) => getTransactionReceipt$(result && result.result))
    ).subscribe((result) => {
      console.log(result, 'result')
      fetchWalletInfo$.next(true)
      closeModal$.next(true)
    })
  }
}