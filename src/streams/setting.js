import ls from 'local-storage'
import { BehaviorSubject } from "rxjs"
import { distinctUntilChanged } from 'rxjs/operators'

export const walletType$ = new BehaviorSubject()