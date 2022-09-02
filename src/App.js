import React, { Component, Fragment, createRef } from 'react'
import BigNumber from 'bignumber.js'
import { browserHistory } from 'react-router'
import { timer, fromEvent, Subject, merge, forkJoin, from, interval, of, combineLatest } from 'rxjs'
import { takeUntil, filter, retryWhen, startWith, map, tap, mergeMap, switchMap, delay, distinctUntilChanged, debounceTime, pairwise } from 'rxjs/operators'
import cx from 'classnames'
import 'utils/tweening'

BigNumber.config({
  EXPONENTIAL_AT: 1000,
  DECIMAL_PLACES: 80,
})

import { localeChange$ } from 'streams/i18n'
import { selectedAddress$ } from 'streams/wallet'
import { 
  listTokenSupplyInfo$, 
  getKlevaAnnualReward$, 
  getWorkerInfo$, 
  getFarmDeposited$, 
  calcUnlockableAmount$,
  lockOf$,
  getYearlyKSP$,
} from './streams/contract'

import CoverLayer from 'components/CoverLayer'

import './App.scss'
import { isFocused$, shouldNavigationTabFloat$, showFooter$, showStartButton$ } from './streams/ui'
import { debtTokens, tokenList } from './constants/tokens'
import { stakingPools } from './constants/stakingpool'
import { lendingTokenSupplyInfo$ } from './streams/vault'
import { lendingPools } from './constants/lendingpool'
import { fetchUnlockAmount$, lockedKlevaAmount$, unlockableKlevaAmount$ } from './streams/wallet'
import { vaultInfoFetcher$, walletInfoFetcher$ } from './streams/fetcher'
import { aprInfo$, farmPoolDeposited$, klevaAnnualRewards$, workerInfo$, klayswapPoolInfo$, protocolAPR$, fetchLendingInfo$, farmPoolDepositedByAddress$ } from './streams/farming'
import { fetchKlayswapInfo$, tokenPrices$ } from './streams/tokenPrice'
import { calcProtocolAPR } from './utils/calc'
import { farmPool } from './constants/farmpool'
import { workers } from './constants/workers'
import { addressKeyFind } from './utils/misc'
import { currentTab$ } from './streams/view'

type Props = {
  isLoading: boolean,
  children: React.DOM,
}

class App extends Component<Props> {
  destroy$ = new Subject()

  $app = createRef()

  constructor(props) {
    super(props)

    this.state = {
      isLoading: false,
      languageChanged: 0,
    }
  }

  componentDidMount() {

    const isLoggedInFirst$ = selectedAddress$.pipe(
      pairwise(),
      map(([before, after]) => {
        return before === undefined && !!after
      })
    )

    isLoggedInFirst$.subscribe(() => {
      currentTab$.next('myasset')
    })

    // Fetch lending token supply info.
    merge(
      fetchLendingInfo$,
      interval(1000 * 10).pipe(
        startWith(0),
      )
    ).pipe(
      switchMap(() => forkJoin(
        listTokenSupplyInfo$(lendingPools, debtTokens),
        fetchKlayswapInfo$,
        getYearlyKSP$(farmPool.filter(({ exchange }) => exchange === 'klayswap')),
      )),
      takeUntil(this.destroy$)
    ).subscribe(([lendingTokenSupplyInfo, klayswapInfo, klayswapMiningInfo]) => {
      lendingTokenSupplyInfo$.next(lendingTokenSupplyInfo)

      tokenPrices$.next({
        ...klayswapInfo && klayswapInfo.priceOutput,
        [tokenList.KLAY.address]: Number(klayswapInfo.klayPrice),
      })

      const poolAprInfo = Object.entries(klayswapMiningInfo).reduce((acc, [lpTokenAddress, yearlyKSP]) => {

        acc[lpTokenAddress] = acc[lpTokenAddress] || {}

        const poolVolume = klayswapInfo?.recentPoolInfo[lpTokenAddress]?.poolVolume 
          || klayswapInfo?.recentPoolInfo[lpTokenAddress.toLowerCase()]?.poolVolume

        const tradeVolume = klayswapInfo?.recentPoolInfo[lpTokenAddress]?.lastHourTradeTotalVolume
          || klayswapInfo?.recentPoolInfo[lpTokenAddress.toLowerCase()]?.lastHourTradeTotalVolume

        acc[lpTokenAddress]['kspMiningAPR'] = new BigNumber(yearlyKSP)
          .multipliedBy(tokenPrices$.value[tokenList.KSP.address])
          .div(poolVolume)
          .multipliedBy(100)
          .multipliedBy(0.85)
          .multipliedBy(0.7) // 30% performance fee
          .toNumber()

        acc[lpTokenAddress]['tradingFeeAPR'] = yearlyKSP 
          ? 0
          : new BigNumber(tradeVolume)
            .multipliedBy(0.003) // 0.3% fee
            .div(2)
            .div(poolVolume)
            .multipliedBy(365)
            .multipliedBy(100)
            .toString()

        acc[lpTokenAddress]['airdropAPR'] = 0

        return acc
      }, {})

      aprInfo$.next(poolAprInfo)

      klayswapPoolInfo$.next(klayswapInfo && klayswapInfo.recentPoolInfo)
    })

    combineLatest([
      lendingTokenSupplyInfo$,
      tokenPrices$,
      farmPoolDeposited$,
      aprInfo$,
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([lendingTokenSupplyInfo, tokenPrices, farmPoolDeposited, aprInfo]) => {

      const ibKlevaLendingPool = addressKeyFind(lendingTokenSupplyInfo, tokenList.ibKLEVA.address)
      const klevaTokenPrice = addressKeyFind(tokenPrices, tokenList.KLEVA.address)
      const ibTokenPrice = ibKlevaLendingPool?.ibTokenPrice

      const ibKlevaTotalSupplyTVL = new BigNumber(ibKlevaLendingPool?.depositedTokenBalance)
        .multipliedBy(klevaTokenPrice)
        .multipliedBy(ibTokenPrice)
        .toNumber()

      const protocolAPR = calcProtocolAPR({
        ibKlevaTotalSupplyTVL,
        aprInfo,
        farmPoolDeposited: Object.values(farmPoolDeposited),
      })

      protocolAPR$.next(protocolAPR)
    })

    // Fetch annual kleva rewards
    getKlevaAnnualReward$([...stakingPools, ...Object.values(debtTokens)]).pipe(
      takeUntil(this.destroy$),
    ).subscribe((res) => {
      klevaAnnualRewards$.next(res)
    })

    merge(
      interval(1000 * 60),
      tokenPrices$,
    ).pipe(
      startWith(0),
    ).pipe(
      switchMap(() => {
        return forkJoin(getWorkerInfo$(workers),)
      }),
      tap(([workerInfo]) => {

        const _workerInfo = Object.entries(workerInfo).reduce((acc, [key, item]) => {
          acc[key.toLowerCase()] = item
          acc[key] = item
          return acc
        }, {})

        workerInfo$.next(_workerInfo)
      }),
      switchMap(() => {
        return getFarmDeposited$(farmPool, workerInfo$.value, tokenPrices$.value)
      }),
      tap(({ byAddress, byPid }) => {

        farmPoolDepositedByAddress$.next(byAddress)

        farmPoolDeposited$.next(byPid)
      }),
      takeUntil(this.destroy$)
    ).subscribe()

    merge(
      isFocused$,
      selectedAddress$.pipe(
        filter((a) => !!a),
        switchMap((selectedAddress) => {

          return walletInfoFetcher$(selectedAddress)
        }),
      ),
    ).pipe(
      debounceTime(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })

    selectedAddress$.pipe(
      filter((a) => !!a),
      switchMap((account) => {

        return merge(
          fetchUnlockAmount$,
          interval(1000 * 5),
        ).pipe(
          startWith(0),
          switchMap(() => forkJoin(calcUnlockableAmount$(account), lockOf$(account))),
          tap(([unlockableLockedAmount, lockedAmount]) => {

            const lockedAmountParsed = new BigNumber(lockedAmount)
              .div(10 ** tokenList.KLEVA.decimals)
              .toNumber()

            const unlockableLockedAmountParsed = new BigNumber(unlockableLockedAmount)
              .div(10 ** tokenList.KLEVA.decimals)
              .toNumber()

            unlockableKlevaAmount$.next(unlockableLockedAmountParsed)
            lockedKlevaAmount$.next(lockedAmountParsed)
          })
        )
      })
    ).subscribe()

    vaultInfoFetcher$.pipe(
      takeUntil(this.destroy$)
    ).subscribe()

    localeChange$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.setState({
        languageChanged: (++this.state.languageChanged) % 3,
      })
    })

    //
    this.checkShowFooter()
    
    merge(
      currentTab$,
      fromEvent(this.$app.current, 'scroll'),
      fromEvent(window, 'resize'),
    ).pipe(
      // debounceTime(50),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.checkShowFooter()
    })
  }

  checkShowFooter = () => {

    const scrollHeight = this.$app.current.scrollHeight
    const clientHeight = this.$app.current.clientHeight
    const height = scrollHeight - clientHeight
    const scrollTop = this.$app.current.scrollTop

    // footer
    const shouldShow = ((scrollTop / height) > 0.8) || (height - scrollTop < 52)
    showFooter$.next(shouldShow)

    // navigation tab
    const shouldFloat = scrollTop > 132 
    shouldNavigationTabFloat$.next(shouldFloat)
  }

  componentWillUnmount() {
    this.destroy$.next(true)
  }

  render() {
    const { languageChanged, isLoading } = this.state
    const { children } = this.props

    return (
      <div key={languageChanged} ref={this.$app} className="App">
        {children}
        <CoverLayer />
      </div>
    )
  }
}

export default App
