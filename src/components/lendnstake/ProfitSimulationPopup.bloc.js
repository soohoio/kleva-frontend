import { BehaviorSubject, Subject, forkJoin } from 'rxjs'
import { takeUntil, tap, switchMap, map } from 'rxjs/operators'
import { BigNumber } from 'bignumber.js';
import { toAPY } from '../../utils/calc';
import { tokenPrices$ } from '../../streams/tokenPrice';
import { tokenList } from 'constants/tokens';

export default class {
  constructor(comp) {
    this.comp = comp
    
    this.amount$ = new BehaviorSubject()
    
    this.protocolProfit$ = new BehaviorSubject()
    this.lendingProfit$ = new BehaviorSubject()
    this.stakingProfit$ = new BehaviorSubject()
    this.totalCompoundProfit$ = new BehaviorSubject()
    this.stakingProfitInKLEVA$ = new BehaviorSubject()

    this.calculatedOnce$ = new BehaviorSubject()
    
    // 10, 30, 180, 365
    this.timePassed$ = new BehaviorSubject(180)
  }

  getTotalAPR = ({ lendingAPR, stakingAPR, protocolAPR }) => {
    const totalAPR = new BigNumber(lendingAPR || 0)
      .plus(stakingAPR || 0)
      .plus(protocolAPR || 0)
      .toString()

    return totalAPR
  }

  calculate = ({ stakingToken, lendingAPR, stakingAPR, protocolAPR, totalAPY }) => {

    console.log(lendingAPR, stakingAPR, protocolAPR, totalAPY)

    const lendingProfit = this.aprToProfit(lendingAPR)
    const stakingProfit = this.aprToProfit(stakingAPR)
    const protocolProfit = this.aprToProfit(protocolAPR)
    const totalCompoundProfit = this.aprToProfit(totalAPY)

    // Staking profit in KLEVA
    const klevaPrice = tokenPrices$.value[tokenList.KLEVA.address.toLowerCase()]
    const stakingProfitInDollar = this.amountInDollar(stakingToken, stakingProfit)
    const stakingProfitInKLEVA = new BigNumber(stakingProfitInDollar).div(klevaPrice).toString()

    this.lendingProfit$.next(lendingProfit)
    this.stakingProfit$.next(stakingProfit)
    
    this.stakingProfitInKLEVA$.next(stakingProfitInKLEVA)

    this.protocolProfit$.next(protocolProfit)
    this.totalCompoundProfit$.next(totalCompoundProfit)
  }

  amountInDollar = (stakingToken, amount) => {

    return new BigNumber(amount)
      .multipliedBy(tokenPrices$.value[stakingToken.address.toLowerCase()])
      .toString()
  }

  aprToProfit = (apr) => {
    const expectedProfitAfterYear = new BigNumber(this.amount$.value || 0)
      .multipliedBy(apr || 0)
      .div(100)
      .toString()

    const profitPerDay = new BigNumber(expectedProfitAfterYear)
      .div(365)

    const profit = new BigNumber(profitPerDay)
      .multipliedBy(this.timePassed$.value)
      .toString()

    return profit
  }
} 
