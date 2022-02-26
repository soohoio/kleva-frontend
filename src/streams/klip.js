import React from 'react'

import { BehaviorSubject, defer, from, interval, Observable, of, Subject } from 'rxjs'
import { distinctUntilChanged, switchMap, takeUntil, map, delay, tap, retryWhen, mergeMap } from 'rxjs/operators'
import { prepare, request, getResult, getCardList } from 'klip-sdk'
import { groupBy } from 'lodash'
import { selectedAddress$ } from 'streams/wallet'
import { openModal$ } from 'streams/ui'

import KlipQRCode from '../components/KlipQRCode'
import { toFixed } from '../utils/calc'

export const requestStatus$ = new BehaviorSubject({})

let isIOS = /iPad|iPhone|iPod/.test(navigator.platform) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

const BAPP_NAME = "KLEVA PROTOCOL"

export const getDeeplink = (request_key, userAgent = navigator.userAgent) => {
  let deeplink = ''
  if (request_key) {
    deeplink = `intent://klipwallet/open?url=${encodeURIComponent(`${'https://klipwallet.com'}/?target=/a2a?request_key=${request_key}`)}#Intent;scheme=kakaotalk;package=${'com.kakao.talk'};end`
    if (isIOS) {
      deeplink = `${'kakaotalk'}://klipwallet/open?url=${encodeURIComponent(`${'https://klipwallet.com'}/?target=/a2a?request_key=${request_key}`)}`
    }
    if (!isMobile) {
      deeplink = `${'https://klipwallet.com'}/?target=/a2a?request_key=${request_key}`
    }
  }
  return deeplink
}

const _auth$ = () => {
  console.log('auth!')
  return defer(() => from(prepare.auth({ bappName: BAPP_NAME })))
}

const _execute$ = ({ account, bappName, to, value, abi, params }) => {

  return defer(() => from(prepare.executeContract({ bappName, from: account, to, value, abi, params })))
}

export const accessKlip$ = () => _auth$().pipe(
  switchMap((res) => {
    if (res && res.err) return of(false)
    return request$(res && res.request_key)
  })
)

export const request$ = (requestKey) => {
  return defer(() => _request$(requestKey)).pipe(
    switchMap(() => _requestKeyResultPoll$(requestKey)),
    map((result) => {
      return result
    })
  )
}

const _request$ = (requestKey) => new Observable((observer) => {
  const qrCodeMode = !isMobile
  if (qrCodeMode) {
    openModal$.next({
      component: <KlipQRCode observer={observer} request_key={requestKey} />
    })
    return
  }

  top.window.location.href = getDeeplink(requestKey)
  observer.next(true)
  observer.complete()

  // request(requestKey, () => {
  //   alert('not supported.')
  //   observer.next("not supported")
  //   observer.complete()
  // })

  // observer.next(true)
  // observer.complete()
})

const _requestKeyResultPoll$ = (requestKey) => {
  const _destroy$ = new Subject()
  return new Observable((observer) => {
    interval(1000).pipe(
      switchMap(() => {
        return getResult(requestKey)
      }),
      map((r) => {
        return r && r.result || r
      }),
      takeUntil(_destroy$),
    ).subscribe((result) => {
      const _status = result && result.status
      
      if ((result && result.klaytn_address) || _status === "success" || _status === "fail") {
        observer.next(result)
        observer.complete(result)
        _destroy$.next(true)
        return
      }
    })
  })
}

export const executeContractKlip$ = ({ bappName = BAPP_NAME, from, to, value, abi, params }) => {

  return _execute$({ account: from, bappName, to, value, abi: JSON.stringify(abi), params: JSON.stringify(params) }).pipe(
    switchMap((res) => {
      if (res && res.err) return of(false)
      return request$(res && res.request_key)
    }),
  retryWhen((errors) => {
    return errors.pipe(
      tap((err) => {
        console.log(err, "klip error")
      }),
      delay(2000),
    )
  })
  )
}