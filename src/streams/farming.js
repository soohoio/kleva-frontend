import { BehaviorSubject, Subject } from "rxjs";
import { map } from "rxjs/operators"

import { ajax$ } from 'streams/api'

export const workerInfo$ = new BehaviorSubject({})
export const aprInfo$ = new BehaviorSubject({})

export const poolReserves$ = new BehaviorSubject({})
export const fetchPoolReserves$ = new Subject()
export const klevaAnnualRewards$ = new BehaviorSubject({})

export const farmPoolTVL$ = new BehaviorSubject({})