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
import { balanceOfMultiInWallet$, balanceOfMultiInStakingPool$, listTokenSupplyInfo$, allowancesMultiInLendingPool$, caver } from './streams/contract'

import Overlay from 'components/Overlay'
// import Toast from 'components/Toast'

import './App.scss'
import { isFocused$ } from './streams/ui'
import { tokenList } from './constants/tokens'
import { stakingPools } from './constants/stakingpool'
import { lendingTokenSupplyInfo$ } from './streams/vault'
import { lendingPools } from './constants/lendingpool'
import { fetchWalletInfo$ } from './streams/wallet'
import { walletInfoFetcher$ } from './streams/fetcher'
import { GRAPH_NODE_URL } from 'streams/graphql'
import LZUTF8 from 'lzutf8'

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
    connectInjected('metamask')

    // Fetch lending token supply info.
    interval(1000 * 10).pipe(
      startWith(0),
      switchMap(() => forkJoin(listTokenSupplyInfo$(lendingPools)))
    ).subscribe(([lendingTokenSupplyInfo]) => {
      lendingTokenSupplyInfo$.next(lendingTokenSupplyInfo)
    })

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
