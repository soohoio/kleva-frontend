import React from 'react'
import { BehaviorSubject } from "rxjs"
import { switchMap, tap } from 'rxjs/operators'
import BigNumber from 'bignumber.js'

import { getTransactionReceipt$, unwrapWKLAY$, wrapKLAY$ } from "../../streams/contract"
import { fetchWalletInfo$ } from "../../streams/wallet"
import { tokenList } from "../../constants/tokens"

export default class {
  constructor() {
    this.klayAmountToWrap$ = new BehaviorSubject('')
    this.wklayAmountToUnwrap$ = new BehaviorSubject('')
    this.isWrapping$ = new BehaviorSubject(false)
  }

  wrapKLAY = () => {
    const amount = new BigNumber(this.klayAmountToWrap$.value)
      .multipliedBy(10 ** tokenList.WKLAY.decimals)
      .toString()

    wrapKLAY$(amount).pipe(
      tap(() => {
        this.isWrapping$.next(true)
      }),
      switchMap((result) => getTransactionReceipt$(result && result.result || result.tx_hash))
    ).subscribe((result) => {
      this.isWrapping$.next(false)
      fetchWalletInfo$.next(true)
      this.klayAmountToWrap$.next('')
    })
  }
  
  unwrapWKLAY = () => {
    const unwrapAmount = new BigNumber(this.wklayAmountToUnwrap$.value)
      .multipliedBy(10 ** 18)
      .toString()

    unwrapWKLAY$(unwrapAmount).pipe(
      tap(() => {
        this.isWrapping$.next(true)
      }),
      switchMap((result) => getTransactionReceipt$(result && result.result || result.tx_hash))
    ).subscribe(() => {
      this.isWrapping$.next(false)
      fetchWalletInfo$.next(true)
      this.wklayAmountToUnwrap$.next('')
    })
  }
}