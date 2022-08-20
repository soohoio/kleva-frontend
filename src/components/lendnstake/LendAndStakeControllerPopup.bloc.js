import React from 'react'
import { BehaviorSubject } from "rxjs"
import { switchMap, tap } from 'rxjs/operators'
import BigNumber from 'bignumber.js'

import { approve$, depositForLending$, getTransactionReceipt$, stakeToStakingPool$, wrapKLAY$ } from "../../streams/contract"
import { MAX_UINT } from 'constants/setting'
import { fetchWalletInfo$ } from "../../streams/wallet"
import { closeContentView$, closeModal$, contentView$, openModal$ } from "../../streams/ui"
import { tokenList } from "../../constants/tokens"
import CompletedModal from "../common/CompletedModal"
import { I18n } from "../common/I18n"
import { currentTab$ } from "../../streams/view"
import { FAIRLAUNCH } from '../../constants/address'

export default class {
  constructor() {
    this.depositAmount$ = new BehaviorSubject('')
    this.stakeAmount$ = new BehaviorSubject('')
    this.klayAmountToWrap$ = new BehaviorSubject('')
    this.isLoading$ = new BehaviorSubject(false)
    this.isWrapping$ = new BehaviorSubject(false)

    this.lendCompleted$ = new BehaviorSubject(false)
  }

  handleChange = (e) => {
    this.depositAmount$.next(e.target.value)
  }

  handleStakeChange = (e) => {
    this.stakeAmount$.next(e.target.value)
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
    const depositAmount = new BigNumber(this.depositAmount$.value)
      .multipliedBy(10 ** stakingToken.decimals)
      .toString()

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

      this.lendCompleted$.next(true)
      // closeModal$.next(true)
    })

    // this.lendCompleted$.next(true)
  }

  approveStaking = (stakingToken) => {
    approve$(stakingToken.address, FAIRLAUNCH, MAX_UINT).pipe(
      tap(() => this.isLoading$.next(true)),
      switchMap((result) => getTransactionReceipt$(result && result.result || result.tx_hash))
    ).subscribe((result) => {
      this.isLoading$.next(false)
      fetchWalletInfo$.next(true)
    })
  }

  stake = (stakingToken, pid, accountFor) => {
    const stakeAmountPure = new BigNumber(this.stakeAmount$.value)
      .multipliedBy(10 ** stakingToken.decimals)
      .toString()

    stakeToStakingPool$(accountFor, pid, stakeAmountPure).pipe(
      tap(() => this.isLoading$.next(true)),
      switchMap((result) => getTransactionReceipt$(result && result.result || result.tx_hash))
    ).subscribe((result) => {
      this.isLoading$.next(false)
      fetchWalletInfo$.next(true)
      // closeModal$.next(true)

      openModal$.next({
        component: (
          <CompletedModal menus={[
            {
              title: I18n.t('viewInMyAsset'),
              onClick: () => {
                closeModal$.next(true)
                currentTab$.next('myasset')
              }
            },
            {
              title: I18n.t('checkLater'),
              onClick: () => {
                closeModal$.next(true)
              }
            },
          ]}>
            <p className="CompletedModal__title">{I18n.t('lendstake.controller.stakeCompleted.title')}</p>
            <p className="CompletedModal__description">{I18n.t('lendstake.controller.stakeCompleted.description')}</p>
          </CompletedModal>
        )
      })
    })
  }

  wrapKLAY = () => {
    const amount = new BigNumber(this.klayAmountToWrap$.value)
      .multipliedBy(10 ** tokenList.WKLAY.decimals)
      .toString()

    wrapKLAY$(amount).pipe(
      tap(() => {
        this.isWrapping$.next(true)
        // this.isLoading$.next(true)
      }),
      switchMap((result) => getTransactionReceipt$(result && result.result || result.tx_hash))
    ).subscribe((result) => {
      this.isWrapping$.next(false)
      // this.isLoading$.next(false)
      fetchWalletInfo$.next(true)
      this.klayAmountToWrap$.next('')
    })
  }
}