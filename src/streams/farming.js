import { BehaviorSubject, Subject } from "rxjs";
import { map, filter } from "rxjs/operators"

import { ajax$ } from 'streams/api'

export const workerInfo$ = new BehaviorSubject({})
export const aprInfo$ = new BehaviorSubject({})

export const poolReserves$ = new BehaviorSubject({})
export const fetchPoolReserves$ = new Subject()
export const klevaAnnualRewards$ = new BehaviorSubject({})

export const farmPoolDeposited$ = new BehaviorSubject({})

// Klayswap Info
export const klayswapPoolInfo$ = new BehaviorSubject({})

// positions
export const positions$ = new BehaviorSubject([])
export const userPositionSummary$ = new BehaviorSubject({})

export const fetchPositions$ = new Subject()

window.positions$ = positions$

// Pagination
export const viewingPositionLatestBlockTime$ = new BehaviorSubject()

positions$.pipe(
  filter((positions) => positions && positions.length != 0)
).subscribe((positions) => {
  const latestViewingPosition = positions.reduce((acc, cur) => {
    return new BigNumber(cur.latestBlockTime).gte(acc.latestBlockTime)
      ? cur
      : acc
  })
;
  viewingPositionLatestBlockTime$.next(latestViewingPosition && latestViewingPosition.latestBlockTime)
})


// Protocol APR
export const protocolAPR$ = new BehaviorSubject(0)