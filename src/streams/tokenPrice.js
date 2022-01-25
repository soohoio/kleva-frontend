import { BehaviorSubject, from } from "rxjs";
import { map, mergeMap, switchMap, tap } from "rxjs/operators";
import { tokenList } from "../constants/tokens";

// export const fetchKlayswapInfo$ = from(
//   // fetch("https://api.kltalchemy.com/klay/ksInfo").then((res) => res.json())
//   fetch("https://ks.nodepelican.com/ksInfo").then((res) => res.json())
// )

const KLAYSWAP_INFO_URL = location.host === "kleva.io" 
  ? "https://kleva.io/static/klayswapAPR.json"
  : "https://s3.ap-southeast-1.amazonaws.com/kleva.io/static/klayswapAPR.json"

export const fetchKlayswapInfo$ = from(
  fetch(KLAYSWAP_INFO_URL).then((res) => res.json())
)

export const tokenPrices$ = new BehaviorSubject({})

window.tokenPrices$ = tokenPrices$