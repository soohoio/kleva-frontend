import React from 'react'
import { BehaviorSubject } from "rxjs"
import { switchMap, tap } from 'rxjs/operators'
import BigNumber from 'bignumber.js'

import { approve$, depositForLending$, getTransactionReceipt$, stakeToStakingPool$, unstakeFromStakingPool$, unwrapWKLAY$, withdrawFromLending$, wrapKLAY$ } from "../../streams/contract"
import { MAX_UINT } from 'constants/setting'
import { fetchWalletInfo$ } from "../../streams/wallet"
import { closeContentView$, closeLayeredModal$, closeModal$, contentView$, openLayeredModal$, openModal$ } from "../../streams/ui"
import { tokenList } from "../../constants/tokens"
import CompletedModal from "../common/CompletedModal"
import { I18n } from "../common/I18n"
import { currentTab$ } from "../../streams/view"
import { FAIRLAUNCH } from '../../constants/address'
import LoadingModal from '../modals/LoadingModal'

export default class {
  constructor() {
    this.depositAmount$ = new BehaviorSubject('')
    
    this.stakeAmount$ = new BehaviorSubject('')
    this.unstakeAmount$ = new BehaviorSubject('')
    this.withdrawAmount$ = new BehaviorSubject('')

    this.wklayAmountToUnwrap$ = new BehaviorSubject('')
    this.isLoading$ = new BehaviorSubject(false)
    this.isWrapping$ = new BehaviorSubject(false)

    this.wklayWithdrawCompleted$ = new BehaviorSubject(false)
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

  // ibToken
  withdraw = (stakingToken) => {
    const withdrawAmount = new BigNumber(this.withdrawAmount$.value)
      .multipliedBy(10 ** stakingToken.decimals)
      .toString()

    // if (stakingToken.address == tokenList.ibKLAY.address) {
    //   this.wklayWithdrawCompleted$.next(true)
    // }

    withdrawFromLending$(stakingToken.address, withdrawAmount).pipe(
      tap(() => this.isLoading$.next(true)),
      switchMap((result) => {
        return getTransactionReceipt$(result && result.result || result.tx_hash)
      })
    ).subscribe((result) => {

      this.isLoading$.next(false)
      fetchWalletInfo$.next(true)

      if (stakingToken.address == tokenList.ibKLAY.address) {
        this.wklayWithdrawCompleted$.next(true)
      } else {
        openModal$.next({
          component: (
            <CompletedModal menus={[
              {
                title: I18n.t('confirm'),
                onClick: () => {
                  closeModal$.next(true)
                }
              },
            ]}>
              <p className="CompletedModal__title">{I18n.t('myasset.suwController.withdrawCompleted')}</p>
            </CompletedModal>
          )
        })
      }
    })
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
  
  unstake = (stakingToken, pid, accountFor) => {
    const unstakeAmountPure = new BigNumber(this.unstakeAmount$.value)
      .multipliedBy(10 ** stakingToken.decimals)
      .toString()

    unstakeFromStakingPool$(accountFor, pid, unstakeAmountPure).pipe(
      tap(() => this.isLoading$.next(true)),
      switchMap((result) => getTransactionReceipt$(result && result.result || result.tx_hash))
    ).subscribe((result) => {
      this.isLoading$.next(false)
      fetchWalletInfo$.next(true)

      openModal$.next({
        component: (
          <CompletedModal menus={[
            {
              title: I18n.t('confirm'),
              onClick: () => {
                closeModal$.next(true)
              }
            },
          ]}>
            <p className="CompletedModal__title">{I18n.t('myasset.suwController.unstakingCompleted')}</p>
          </CompletedModal>
        )
      })
    })
  }

  unwrapWKLAY = () => {
    const unwrapAmount = new BigNumber(this.wklayAmountToUnwrap$.value)
      .multipliedBy(10 ** 18)
      .toString()

    unwrapWKLAY$(unwrapAmount).pipe(
      tap(() => {
        openLayeredModal$.next({
          component: <LoadingModal />
        })
        this.isLoading$.next(true)
      }),
      switchMap((result) => getTransactionReceipt$(result && result.result || result.tx_hash))
    ).subscribe(() => {
      closeLayeredModal$.next(true)

      openModal$.next({
        component: (
          <CompletedModal menus={[
            {
              title: I18n.t('confirm'),
              onClick: () => {
                closeModal$.next(true)
              }
            },
          ]}>
            <p className="CompletedModal__title">{I18n.t('convert.completed.title')}</p>
          </CompletedModal>
        )
      })

      this.wklayAmountToUnwrap$.next('')
      this.isLoading$.next(false)
      fetchWalletInfo$.next(true)

      // closeModal$.next(true)
    })
  }
}