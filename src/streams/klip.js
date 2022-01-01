import React from 'react'

import { BehaviorSubject, from, interval, Observable, of, Subject } from 'rxjs'
import { distinctUntilChanged, switchMap, takeUntil, map, delay, tap, retryWhen } from 'rxjs/operators'
import { prepare, request, getResult, getCardList } from 'klip-sdk'
import { groupBy } from 'lodash'
import { selectedAddress$ } from 'streams/wallet'
import { openModal$ } from 'streams/ui'

import KlipQRCode from '../components/KlipQRCode'
import { toFixed } from '../utils/calc'

export const requestStatus$ = new BehaviorSubject({})

const BAPP_NAME = "KLEVA PROTOCOL"

const _auth$ = from(prepare.auth({ bappName: BAPP_NAME }))
const _execute$ = ({ bappName, to, value, abi, params }) => {

  return from(prepare.executeContract({ bappName, to, value, abi, params }))
}

export const accessKlip$ = _auth$.pipe(
  switchMap((res) => {


    if (res && res.err) return of(false)
    return request$(res && res.request_key)
  })
)

export const request$ = (requestKey) => {
  return _request$(requestKey).pipe(
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

  request(requestKey, () => {
    alert('not supported.')
    observer.next("not supported")
    observer.complete()
  })

  observer.next(true)
  observer.complete()
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

export const executeContractKlip$ = ({ bappName = BAPP_NAME, to, value = "0", abi, params }) => {
  return _execute$({ bappName, to, value, abi: JSON.stringify(abi), params: JSON.stringify(params) }).pipe(
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