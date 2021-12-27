import { BehaviorSubject } from 'rxjs'
import BigNumber from 'bignumber.js'
import { getTransactionReceipt$, unwrapWKLAY$, wrapKLAY$ } from '../streams/contract'
import { tokenList } from '../constants/tokens'
import { switchMap } from 'rxjs/operators'
import { fetchWalletInfo$ } from '../streams/wallet'

export default class {
  constructor() {

    this.klayAmountToWrap$ = new BehaviorSubject()

    this.wklayAmount$ = new BehaviorSubject()
  }

  wrapKLAY = () => {
    const amount = new BigNumber(this.klayAmountToWrap$.value)
      .multipliedBy(10 ** tokenList.WKLAY.decimals)
      .toString()
    
    wrapKLAY$(amount).pipe(
      switchMap((result) => getTransactionReceipt$(result && result.result || result.tx_hash))
    ).subscribe((result) => {
      console.log(result, "result")
      fetchWalletInfo$.next(true)
    })
  }

  unwrapWKLAY = () => {
    unwrapWKLAY$(this.klayAmountToWrap$.value).subscribe(() => {

    })
  }
}