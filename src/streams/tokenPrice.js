import { BehaviorSubject, from, of } from "rxjs";
import { catchError, map, mergeMap, switchMap, tap } from "rxjs/operators";
import { tokenList, tokenListByAddress } from "../constants/tokens";
import { addressKeyFind } from '../utils/misc';
import { BigNumber } from 'bignumber.js'

export const fetchKlayswapInfo$ = () => from(
  fetch("https://api.kltalchemy.com/klay/ksInfo").then((res) => res.json())
)

export const fetchKokonutSwapInfo$ = () => from(
  fetch("https://prod.kokonut-api.com/pools")
    .then((res) => res.json())
).pipe(
  catchError(() => {
    return of({ pools: [] })
  }),
  map(({ pools }) => {
    return pools.reduce((acc, cur) => {

      acc.tokenPrices[cur.lpTokenAddress.toLowerCase()] = Number(cur.lpTokenRealPrice)
      acc.aprs[cur.lpTokenAddress.toLowerCase()] = {
        'miningAPR': Number(cur.stakingApr) * 0.7,
        'tradingFeeAPR': Number(cur.baseApr),
        'airdropAPR': 0,
      }

      acc.liquidities[cur.lpTokenAddress.toLowerCase()] = cur.liquidity.map(({ coin, amount }) => {
        const token = coin.toLowerCase() == "0x" + "e".repeat(40)
          ? tokenList.KLAY
          : addressKeyFind(tokenListByAddress, coin)

        if (!token) return {}

        return {
          token,
          amount,
          lpTVL: cur.tvl,
        }
      })

      return acc
    }, {
      tokenPrices: {},
      aprs: {},
      liquidities: {}
    })
  })
)

export const tokenPrices$ = new BehaviorSubject({})

export const liquidities$ = new BehaviorSubject({})

window.tokenPrices$ = tokenPrices$