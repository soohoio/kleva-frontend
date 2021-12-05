import { BehaviorSubject, Subject } from "rxjs";
import { map } from "rxjs/operators"

import { ajax$ } from 'streams/api'

export const workerInfo$ = new BehaviorSubject({})
export const aprInfo$ = new BehaviorSubject({})
export const borrowingInterest$ = new BehaviorSubject({})

export const poolReserves$ = new BehaviorSubject({})

export const fetchPoolReserves$ = new Subject()

export const getAPRInfo$ = () => ajax$('https://kleva.io/static/klayswapAPR.json').pipe(
  map((aprInfoMap) => {
    return Object.entries(aprInfoMap).reduce((acc, [key, val]) => {

      if (acc[key] && acc[key]['kspMiningAPR']) {
        acc[key]['kspMiningAPR'] = Number(acc[key]['kspMiningAPR'].split('%')[0])
      }
      
      if (acc[key] && acc[key]['airdropAPR']) {
        acc[key]['airdropAPR'] = Number(acc[key]['airdropAPR'].split('%')[0])
      }
      
      if (acc[key] && acc[key]['tradingFeeAPR']) {
        acc[key]['tradingFeeAPR'] = Number(acc[key]['tradingFeeAPR'].split('%')[0])
      }

      return acc
    }, aprInfoMap)
  })
)