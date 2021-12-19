import React, { Component, Fragment, createRef } from 'react'
import BigNumber from 'bignumber.js'
import { browserHistory } from 'react-router'
import { timer, fromEvent, Subject, merge, forkJoin, from, interval, of } from 'rxjs'
import { takeUntil, filter, retryWhen, startWith, map, tap, mergeMap, switchMap, delay, distinctUntilChanged } from 'rxjs/operators'
import cx from 'classnames'

BigNumber.config({
  EXPONENTIAL_AT: 1000,
  DECIMAL_PLACES: 80,
})

import { localeChange$ } from 'streams/i18n'
import { isDesktop$ } from 'streams/ui'
import { connectInjected, selectedAddress$, balancesInWallet$, balancesInStakingPool$, allowancesInLendingPool$ } from 'streams/wallet'
import { 
  balanceOfMultiInWallet$, 
  balanceOfMultiInStakingPool$, 
  listTokenSupplyInfo$, 
  allowancesMultiInLendingPool$, 
  caver, 
  getKlevaAnnualReward$, 
  getWorkerInfo$, 
  getFarmDeposited$ 
} from './streams/contract'

import Overlay from 'components/Overlay'
// import Toast from 'components/Toast'

import './App.scss'
import { isFocused$ } from './streams/ui'
import { debtTokens, singleTokens, singleTokensByAddress, tokenList } from './constants/tokens'
import { stakingPools } from './constants/stakingpool'
import { lendingTokenSupplyInfo$ } from './streams/vault'
import { lendingPools } from './constants/lendingpool'
import { fetchWalletInfo$ } from './streams/wallet'
import { vaultInfoFetcher$, walletInfoFetcher$ } from './streams/fetcher'
import { GRAPH_NODE_URL } from 'streams/graphql'
import LZUTF8 from 'lzutf8'
import { aprInfo$, farmPoolDeposited$, klevaAnnualRewards$, workerInfo$ } from './streams/farming'
import { fetchKlayswapInfo$, tokenPrices$ } from './streams/tokenPrice'
import { getAmountOut, calcBestPathToKLAY } from './utils/calc'
import { farmPool } from './constants/farmpool'
import { workers } from './constants/workers'

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
    // Connect Kaikas Wallet
    // connectInjected()
    // connectInjected('metamask')

    // Fetch lending token supply info.
    interval(1000 * 10).pipe(
      startWith(0),
      switchMap(() => forkJoin(
        listTokenSupplyInfo$(lendingPools),
        fetchKlayswapInfo$
      ))
    ).subscribe(([lendingTokenSupplyInfo, klayswapInfo]) => {
      lendingTokenSupplyInfo$.next(lendingTokenSupplyInfo)
      tokenPrices$.next({
        ...klayswapInfo && klayswapInfo.priceOutput,
        [tokenList.KLAY.address]: Number(klayswapInfo.klayPrice),
      })

      const apr = klayswapInfo && klayswapInfo.apr

      const aprInfo = Object.entries(apr).reduce((acc, [key, val]) => {
          if (acc[key] && acc[key]['kspMiningAPR'] && typeof acc[key]['kspMiningAPR'] === 'string') {
            acc[key]['kspMiningAPR'] = Number(acc[key]['kspMiningAPR'].split('%')[0])
          }

          if (acc[key] && acc[key]['airdropAPR'] && typeof acc[key]['airdropAPR'] === 'string') {
            acc[key]['airdropAPR'] = Number(acc[key]['airdropAPR'].split('%')[0])
          }

          if (acc[key] && acc[key]['tradingFeeAPR'] && typeof acc[key]['tradingFeeAPR'] === 'string') {
            acc[key]['tradingFeeAPR'] = Number(acc[key]['tradingFeeAPR'].split('%')[0])
          }

          return acc
      }, apr)

      aprInfo$.next(aprInfo)
    })

    // Fetch annual kleva rewards
    getKlevaAnnualReward$([...stakingPools, ...Object.values(debtTokens)]).pipe(
      takeUntil(this.destroy$),
    ).subscribe((res) => {
      klevaAnnualRewards$.next(res)
    })

    interval(1000 * 60).pipe(
      startWith(0)
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
      switchMap(() => getFarmDeposited$(farmPool, workerInfo$.value)),
      tap((farmDepositedInfo) => {
        farmPoolDeposited$.next(farmDepositedInfo)
      }),
      takeUntil(this.destroy$)
    ).subscribe()

    merge(
      // isDesktop$,
      isFocused$,
      selectedAddress$.pipe(
        filter((a) => !!a),
        switchMap((selectedAddress) => {
          return walletInfoFetcher$(selectedAddress)
        }),
      ),
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })

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
        <Overlay />
        {/* <Toast /> */}
      </div>
    )
  }
}

export default App
