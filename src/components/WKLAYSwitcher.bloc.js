import { BehaviorSubject } from 'rxjs'
import BigNumber from 'bignumber.js'
import { getTransactionReceipt$, unwrapWKLAY$, wrapKLAY$ } from '../streams/contract'
import { tokenList } from '../constants/tokens'
import { switchMap, tap } from 'rxjs/operators'
import { fetchWalletInfo$ } from '../streams/wallet'

export default class {
  constructor() {

    this.klayAmountToWrap$ = new BehaviorSubject()
    this.isLoading$ = new BehaviorSubject()
    this.selectedToken$ = new BehaviorSubject(tokenList.KLAY)

    // this.wklayAmount$ = new BehaviorSubject()
  }

  wrapKLAY = () => {
    const amount = new BigNumber(this.klayAmountToWrap$.value)
      .multipliedBy(10 ** tokenList.WKLAY.decimals)
      .toString()

    wrapKLAY$(amount).pipe(
      tap(() => {
        this.isLoading$.next(true)
      }),
      switchMap((result) => getTransactionReceipt$(result && result.result || result.tx_hash))
    ).subscribe((result) => {
      this.isLoading$.next(false)
      fetchWalletInfo$.next(true)
      this.klayAmountToWrap$.next('')
      this.selectedToken$.next(tokenList.WKLAY)
    })
  }

  unwrapWKLAY = () => {
    // unwrapWKLAY$(this.klayAmountToWrap$.value).subscribe(() => {

    // })
  }
}