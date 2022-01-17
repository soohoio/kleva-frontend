import { timer, fromEvent, Subject, merge, forkJoin, from, interval, of } from 'rxjs'
import { takeUntil, filter, retryWhen, startWith, map, tap, mergeMap, switchMap, delay, distinctUntilChanged } from 'rxjs/operators'

import { connectInjected, selectedAddress$, balancesInWallet$, balancesInStakingPool$, allowancesInLendingPool$, allowancesInStakingPool$ } from 'streams/wallet'
import { balanceOfMultiInWallet$, balanceOfMultiInStakingPool$, listTokenSupplyInfo$, allowancesMultiInLendingPool$ } from 'streams/contract'
import { fetchWalletInfo$ } from 'streams/wallet'

import { tokenList } from 'constants/tokens'
import { stakingPools } from 'constants/stakingpool'
import { lendingPools } from 'constants/lendingpool'
import { allowancesMultiInStakingPool$, getPendingGTInFairlaunchPool$, getPoolAmountOfStakingPool$ } from './contract'
import { poolAmountInStakingPool$ } from './vault'
import { logout$, pendingGT$ } from './wallet'
import { debtTokens } from '../constants/tokens'

const WALLET_INFO_FETCH_INTERVAL = 5000
const VAULT_INFO_FETCH_INTERVAL = 5000

const tokenAddressList = [...Object.values(tokenList).filter(({ title }) =>
  title !== "KLAY"
  // title !== "BNB"
)]

export const walletInfoFetcher$ = (selectedAddress) => merge(
  fetchWalletInfo$,
  interval(WALLET_INFO_FETCH_INTERVAL)
).pipe(
  startWith(0),
  switchMap(() => {

    return forkJoin(
      balanceOfMultiInWallet$(selectedAddress, tokenAddressList),
      balanceOfMultiInStakingPool$(selectedAddress, stakingPools),
      allowancesMultiInLendingPool$(selectedAddress, lendingPools.filter(({ stakingToken }) => !stakingToken.nativeCoin)),
      allowancesMultiInStakingPool$(selectedAddress, stakingPools),
      getPendingGTInFairlaunchPool$([...stakingPools, ...Object.values(debtTokens)], selectedAddress),
      // earnedMulti$(address, vaultList),
      // depositedAtMulti$(address, vaultAddressList),
    )
  }),
  tap(([
    balancesInWallet, 
    balancesInStakingPool, 
    allowancesInLendingPool, 
    allowancesInStakingPool, 
    pendingGT,
  ]) => {
    balancesInWallet$.next(balancesInWallet)
    balancesInStakingPool$.next(balancesInStakingPool)
    allowancesInLendingPool$.next(allowancesInLendingPool)
    allowancesInStakingPool$.next(allowancesInStakingPool)

    pendingGT$.next({
      ...pendingGT$.value,
      ...pendingGT,
    })
    // depositedAt$.next(depositedAt)
  }),
  retryWhen((errors) => {
    return errors.pipe(
      tap((err) => {
        console.log(err, 'wallet info fetch')
      }),
      delay(2500),
    )
  }),
  takeUntil(logout$)
)

export const vaultInfoFetcher$ = merge(
  interval(VAULT_INFO_FETCH_INTERVAL)
).pipe(
  startWith(0),
  switchMap(() => {
    // Staking Pool Global Deposited Amount
    return forkJoin(
      getPoolAmountOfStakingPool$(stakingPools),
    )
  }),
  tap(([poolAmountInStakingPool]) => {
    poolAmountInStakingPool$.next(poolAmountInStakingPool)
  })
)