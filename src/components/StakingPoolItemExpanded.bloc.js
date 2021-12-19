import { BehaviorSubject } from "rxjs"
import BigNumber from 'bignumber.js'

import { 
  stakeToStakingPool$,
  unstakeFromStakingPool$,
  harvestFromStakingPool$,
} from 'streams/contract'
import { approve$, getTransactionReceipt$ } from "../streams/contract"
import { FAIRLAUNCH } from 'constants/address'
import { switchMap, tap } from "rxjs/operators"
import { fetchWalletInfo$ } from "../streams/wallet"
import { MAX_UINT } from "../constants/setting"

export default class {
  constructor(stakingToken, pid) {
    this.stakingToken = stakingToken
    this.pid = pid
    this.stakeAmount$ = new BehaviorSubject('')
    this.unstakeAmount$ = new BehaviorSubject('')
    this.isLoading$ = new BehaviorSubject(false)
  }

  handleStakeAmountChange = (e) => {
    this.stakeAmount$.next(e.target.value)
  }
  
  handleUnstakeAmountChange = (e) => {
    this.unstakeAmount$.next(e.target.value)
  }

  approve = (stakingToken) => {
    approve$(stakingToken.address, FAIRLAUNCH, MAX_UINT).pipe(
      tap(() => this.isLoading$.next(true)),
      switchMap((result) => getTransactionReceipt$(result && result.result))
    ).subscribe((result) => {
      this.isLoading$.next(false)
      fetchWalletInfo$.next(true)
    })
  }

  stake = (accountFor) => {
    const stakeAmountPure = new BigNumber(this.stakeAmount$.value)
      .multipliedBy(10 ** this.stakingToken.decimals)
      .toString()

    stakeToStakingPool$(accountFor, this.pid, stakeAmountPure).pipe(
      tap(() => this.isLoading$.next(true)),
      switchMap((result) => getTransactionReceipt$(result && result.result))
    ).subscribe((result) => {
      this.isLoading$.next(false)
    })
  }

  unstake = (accountFor) => {
    const unstakeAmountPure = new BigNumber(this.unstakeAmount$.value)
      .multipliedBy(10 ** this.stakingToken.decimals)
      .toString()
    unstakeFromStakingPool$(accountFor, this.pid, unstakeAmountPure).pipe(
      tap(() => this.isLoading$.next(true)),
      switchMap((result) => getTransactionReceipt$(result && result.result))
    ).subscribe((result) => {
      this.isLoading$.next(false)
    })
  }

  harvest = () => {
    harvestFromStakingPool$(this.pid).pipe(
      tap(() => this.isLoading$.next(true)),
      switchMap((result) => getTransactionReceipt$(result && result.result))
    ).subscribe((result) => {
      this.isLoading$.next(false)
    })
  }
}