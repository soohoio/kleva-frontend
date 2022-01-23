import { BehaviorSubject, from } from "rxjs";
import { map, mergeMap, switchMap, tap } from "rxjs/operators";
import { tokenList } from "../constants/tokens";

// export const fetchKlayswapInfo$ = from(
//   // fetch("https://api.kltalchemy.com/klay/ksInfo").then((res) => res.json())
//   fetch("https://ks.nodepelican.com/ksInfo").then((res) => res.json())
// )

export const fetchKlayswapInfo$ = from(
  fetch("https://kleva.io/static/klayswapAPR.json").then((res) => res.json())
)

export const tokenPrices$ = new BehaviorSubject({})

window.tokenPrices$ = tokenPrices$