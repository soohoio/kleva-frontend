import ls from 'local-storage'
import { BehaviorSubject } from "rxjs"
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