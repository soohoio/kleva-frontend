import { BehaviorSubject, from } from "rxjs";
import { map, mergeMap, switchMap, tap } from "rxjs/operators";
import { tokenList } from "../constants/tokens";

export const fetchKlayswapInfo$ = () => from(
  fetch("https://api.kltalchemy.com/klay/ksInfo").then((res) => res.json())
)

export const fetchKokonutSwapInfo$ = () => from(
  fetch("https://prod.kokonut-api.com/pools")
    .then((res) => res.json())
).pipe(
  map(({ pools }) => {
    return pools.reduce((acc, cur) => {
      acc.tokenPrices[cur.lpTokenAddress.toLowerCase()] = Number(cur.lpTokenRealPrice)
      acc.aprs[cur.address.toLowerCase()] = Number(cur.stakingApr)
      return acc
    }, {
      tokenPrices: {},
      aprs: {},
    })
  })
)

export const tokenPrices$ = new BehaviorSubject({})

window.tokenPrices$ = tokenPrices$