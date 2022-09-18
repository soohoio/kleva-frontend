import React from 'react'
import { BehaviorSubject } from "rxjs"
import { switchMap, tap } from 'rxjs/operators'
import BigNumber from 'bignumber.js'

import { getTransactionReceipt$, unwrapWKLAY$, wrapKLAY$ } from "../../streams/contract"
import { fetchWalletInfo$ } from "../../streams/wallet"
import { closeModal$, modalContentComponent$, openLayeredModal$, openModal$ } from "../../streams/ui"
import { tokenList } from "../../constants/tokens"

import LoadingModal from "../modals/LoadingModal"
import CompletedModal from "./CompletedModal"
import { I18n } from "./I18n"

export default class {
  constructor(comp) {

    this.comp = comp
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
        // this.isWrapping$.next(true)
        const open$ = modalContentComponent$.value ? openLayeredModal$ : openModal$
        open$.next({ component: <LoadingModal /> })
      }),
      switchMap((result) => getTransactionReceipt$(result && result.result || result.tx_hash))
    ).subscribe((result) => {
      // this.isWrapping$.next(false)
      const open$ = modalContentComponent$.value ? openLayeredModal$ : openModal$

      open$.next({
        component: (
          <CompletedModal menus={[
            {
              title: I18n.t('confirm'),
              onClick: () => {
                closeModal$.next(true)
                const elem = document.querySelector(".InputWithPercentage--WKLAY input")
                if (elem) {
                  elem.focus()
                }
              }
            },
          ]}>
            <p className="CompletedModal__title">{I18n.t('convert.completed.title')}</p>
            {this.comp.props.noCompleteDescription 
              ? ""
              : <p className="CompletedModal__description">{I18n.t('convert.completed.description')}</p>
            }
          </CompletedModal>
        )
      })
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
        // this.isWrapping$.next(true)
        openLayeredModal$.next({
          component: <LoadingModal />
        })
      }),
      switchMap((result) => getTransactionReceipt$(result && result.result || result.tx_hash))
    ).subscribe(() => {
      // this.isWrapping$.next(false)
      openLayeredModal$.next({
        component: (
          <CompletedModal
            menus={[
              {
                title: I18n.t('confirm'),
                onClick: () => {
                  closeModal$.next(true)
                  const elem = document.querySelector(".InputWithPercentage--WKLAY input")
                  if (elem) {
                    elem.focus()
                  }
                }
              },
            ]}
          >
            <p className="CompletedModal__title">{I18n.t('convert.completed.title')}</p>
            {this.comp.props.noCompleteDescription
              ? ""
              : <p className="CompletedModal__description">{I18n.t('convert.completed.description')}</p>
            }
          </CompletedModal>
        )
      })
      fetchWalletInfo$.next(true)
      this.wklayAmountToUnwrap$.next('')
    })
  }
}