import ls from 'local-storage'
import { BehaviorSubject, Subject } from "rxjs"
import { distinctUntilChanged } from 'rxjs/operators'

export const showSummaryDefault$ = new BehaviorSubject(ls.get('showSummaryDefault$'))
export const showDetailDefault$ = new BehaviorSubject(ls.get('showDetailDefault$'))

showSummaryDefault$.subscribe((val) => {
  ls.set('showSummaryDefault$', val)
})

showDetailDefault$.subscribe((val) => {
  ls.set('showDetailDefault$', val)
})

export const walletType$ = new BehaviorSubject()

// export const slippage$ = new BehaviorSubject(ls.get('slippage$') || 0.5)
export const slippage$ = new BehaviorSubject(0.5)

// slippage$.subscribe((val) => {
//   ls.set('slippage$', val)
// })

export const readNotiMap$ = new BehaviorSubject(ls.get('readNotiMap$') || {})

export const readNoti$ = new Subject()

readNoti$.subscribe((notiKey) => {

  readNotiMap$.next({
    ...readNotiMap$.value,
    [notiKey]: true,
  })
})

readNotiMap$.subscribe((values) => {
  ls.set('readNotiMap$', {
    ...values,
  })
})