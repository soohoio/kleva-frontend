import { BehaviorSubject, from } from "rxjs";
import { switchMap, tap } from "rxjs/operators";
import { tokenList } from "../constants/tokens";

export const fetchKlayswapInfo$ = from(fetch("https://api.birkosully.com/api/klaytn/klayswapInfo")).pipe(
  switchMap((res) => from(res.json())),
  tap(console.log)
)

export const tokenPrices$ = new BehaviorSubject({})