import { BehaviorSubject } from "rxjs"
import BigNumber from 'bignumber.js'

import { 
  stakeToStakingPool$,
  unstakeFromStakingPool$,
  harvestFromStakingPool$,
} from 'streams/contract'
import { approve$, getTransactionReceipt$ } from "../streams/contract"
import { FAIRLAUNCH } from 'constants/address'
import { switchMap } from "rxjs/operators"
import { fetchWalletInfo$ } from "../streams/wallet"
import { MAX_UINT } from "../constants/setting"

export default class {
  constructor(stakingToken, pid) {
    this.stakingToken = stakingToken
    this.pid = pid
    this.stakeAmount$ = new BehaviorSubject('')
    this.unstakeAmount$ = new BehaviorSubject('')
  }

  handleStakeAmountChange = (e) => {
    this.stakeAmount$.next(e.target.value)
  }
  
  handleUnstakeAmountChange = (e) => {
    this.unstakeAmount$.next(e.target.value)
  }

  approve = (stakingToken) => {
    approve$(stakingToken.address, FAIRLAUNCH, MAX_UINT).pipe(
      switchMap((result) => getTransactionReceipt$(result && result.result))
    ).subscribe((result) => {
      console.log(result, 'approve result')
      fetchWalletInfo$.next(true)
    })
  }

  stake = (accountFor) => {
    const stakeAmountPure = new BigNumber(this.stakeAmount$.value)
      .multipliedBy(10 ** this.stakingToken.decimals)
      .toString()

    stakeToStakingPool$(accountFor, this.pid, stakeAmountPure).pipe(
      switchMap((result) => getTransactionReceipt$(result && result.result))
    ).subscribe((result) => {
      console.log(result, '*result')
    })
  }

  unstake = (accountFor) => {
    const unstakeAmountPure = new BigNumber(this.unstakeAmount$.value)
      .multipliedBy(10 ** this.stakingToken.decimals)
      .toString()
    unstakeFromStakingPool$(accountFor, this.pid, unstakeAmountPure).pipe(
      switchMap((result) => getTransactionReceipt$(result && result.result))
    ).subscribe((result) => {
      console.log(result, '*result')
    })
  }

  harvest = () => {
    harvestFromStakingPool$(this.pid).pipe(
      switchMap((result) => getTransactionReceipt$(result && result.result))
    ).subscribe((result) => {
      console.log(result, '*result')
    })
  }
}