import React, { Component, Fragment, createRef } from 'react'
import BigNumber from 'bignumber.js'
import cx from 'classnames'
import { Subject, merge, interval, forkJoin } from 'rxjs'
import { takeUntil, tap, switchMap, startWith, debounceTime } from 'rxjs/operators'
import './LendingPoolList.scss'
import { lendingPools, PROTOCOL_FEE } from '../constants/lendingpool'
import LendingPoolListItem from './LendingPoolListItem'
import { listTokenSupplyInfo$ } from '../streams/contract'
import { lendingTokenSupplyInfo$, poolAmountInStakingPool$ } from '../streams/vault'
import { balancesInWallet$, selectedAddress$ } from '../streams/wallet'
import { isDesktop$ } from '../streams/ui'
import LendingPoolListItemCard from './LendingPoolListItemCard'
import { stakingPoolsByToken } from '../constants/stakingpool'
import { klevaAnnualRewards$ } from '../streams/farming'
import { tokenPrices$ } from '../streams/tokenPrice'
import { tokenList } from '../constants/tokens'

const LendingPoolListTableHeader = () => {
  return (
    <div className="LendingPoolListTableHeader">
      <div>Asset</div>
      <div>APR/APY</div>
      <div>Total Supply</div>
      <div>Total Borrowed</div>
      <div>Utilization</div>
      <div>My Balance</div>
      <div>&nbsp;</div>
    </div>
  )
}

class LendingPoolList extends Component {
  destroy$ = new Subject()
  
  state = {
    activeIdx: 0,
  }

  componentDidMount() {
    merge(
      isDesktop$,
      lendingTokenSupplyInfo$,
      balancesInWallet$,
      poolAmountInStakingPool$,
      klevaAnnualRewards$,
      tokenPrices$,
      selectedAddress$,
    ).pipe(
      debounceTime(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }
    
  render() {
    const { activeIdx } = this.state

    return (
      <div className="LendingPoolList">
        <p className="LendingPoolList__title">Lending Pools</p>

        {isDesktop$.value 
          ? (
            <>
              <LendingPoolListTableHeader />
              <div className="LendingPoolList__tableContents">
                {lendingPools.map(({ title, stakingToken, vaultAddress }) => {
                  const lendingTokenSupplyInfo = lendingTokenSupplyInfo$.value[vaultAddress]
                  
                  const totalSupply = lendingTokenSupplyInfo && lendingTokenSupplyInfo.totalSupply
                  const totalBorrowed = lendingTokenSupplyInfo && lendingTokenSupplyInfo.totalBorrowed
                  const depositedTokenBalance = lendingTokenSupplyInfo && lendingTokenSupplyInfo.depositedTokenBalance
                  const ibTokenPrice = lendingTokenSupplyInfo && lendingTokenSupplyInfo.ibTokenPrice
                  const ibTokenAddress = vaultAddress
                  const originalToken = lendingTokenSupplyInfo && lendingTokenSupplyInfo.ibToken.originalToken

                  const _stakingPool = stakingPoolsByToken[ibTokenAddress]
                  const _stakingPoolPID = _stakingPool && _stakingPool.pid
                  const poolDepositedAmount = poolAmountInStakingPool$.value[_stakingPoolPID]
                  const klevaAnnualReward = klevaAnnualRewards$.value[_stakingPoolPID]
                  const klevaPrice = tokenPrices$.value[tokenList.KLEVA.address.toLowerCase()]
                  const originalTokenPrice = tokenPrices$.value[originalToken && originalToken.address.toLowerCase()]
                  const ibTokenPriceRatio = ibTokenPrice
                  const ibTokenPriceInUSD = originalTokenPrice * ibTokenPriceRatio

                  const tvl = new BigNumber(depositedTokenBalance)
                    .multipliedBy(tokenPrices$.value[stakingToken.address.toLowerCase()])
                    .toNumber()

                  const stakingAPR = new BigNumber(klevaAnnualReward)
                    .multipliedBy(klevaPrice)
                    .div(poolDepositedAmount * ibTokenPriceInUSD)
                    .multipliedBy(100)
                    .toNumber()

                  const utilization = new BigNumber(totalBorrowed)
                    .div(totalSupply)
                    .multipliedBy(100)
                    .toNumber()

                  const borrowingInterest = lendingTokenSupplyInfo$.value &&
                    lendingTokenSupplyInfo$.value[stakingToken.address] &&
                    lendingTokenSupplyInfo$.value[stakingToken.address].borrowingInterest

                  const lendingAPR = new BigNumber(borrowingInterest)
                    .multipliedBy(utilization / 100)
                    .multipliedBy(1 - PROTOCOL_FEE)
                    .multipliedBy(100)
                    .toNumber()

                  return (
                    <LendingPoolListItem
                      selectedAddress={selectedAddress$.value}
                      key={title}
                      balanceInWallet={balancesInWallet$.value[stakingToken.address]}
                      ibTokenBalanceInWallet={balancesInWallet$.value[ibTokenAddress]}
                      lendingAPR={lendingAPR}
                      title={title}
                      utilization={utilization}
                      stakingToken={stakingToken}
                      vaultAddress={vaultAddress}
                      totalSupply={totalSupply}
                      totalBorrowed={totalBorrowed}
                      ibTokenPrice={ibTokenPrice}
                      depositedTokenBalance={depositedTokenBalance}
                      stakingAPR={stakingAPR}
                      tvl={tvl}
                    />
                  )
                })}
              </div>
            </>
          )
          : (
            <div className="LendingPoolList__cardContents">
              {lendingPools.map(({ title, stakingToken, vaultAddress }, idx) => {
                const lendingTokenSupplyInfo = lendingTokenSupplyInfo$.value[vaultAddress]
                const totalSupply = lendingTokenSupplyInfo && lendingTokenSupplyInfo.totalSupply
                const totalBorrowed = lendingTokenSupplyInfo && lendingTokenSupplyInfo.totalBorrowed
                const depositedTokenBalance = lendingTokenSupplyInfo && lendingTokenSupplyInfo.depositedTokenBalance
                const ibTokenPrice = lendingTokenSupplyInfo && lendingTokenSupplyInfo.ibTokenPrice
                const ibTokenAddress = vaultAddress
                const originalToken = lendingTokenSupplyInfo && lendingTokenSupplyInfo.ibToken.originalToken

                const _stakingPool = stakingPoolsByToken[ibTokenAddress]
                const _stakingPoolPID = _stakingPool && _stakingPool.pid
                const poolDepositedAmount = poolAmountInStakingPool$.value[_stakingPoolPID]
                const klevaAnnualReward = klevaAnnualRewards$.value[_stakingPoolPID]
                const klevaPrice = tokenPrices$.value[tokenList.KLEVA.address.toLowerCase()]
                const originalTokenPrice = tokenPrices$.value[originalToken && originalToken.address.toLowerCase()]
                const ibTokenPriceRatio = ibTokenPrice
                const ibTokenPriceInUSD = originalTokenPrice * ibTokenPriceRatio

                const tvl = new BigNumber(depositedTokenBalance)
                  .multipliedBy(tokenPrices$.value[stakingToken.address.toLowerCase()])
                  .toNumber()

                const stakingAPR = new BigNumber(klevaAnnualReward)
                  .multipliedBy(klevaPrice)
                  .div(poolDepositedAmount * ibTokenPriceInUSD)
                  .multipliedBy(100)
                  .toNumber()

                const utilization = new BigNumber(totalBorrowed)
                  .div(totalSupply)
                  .multipliedBy(100)
                  .toNumber()

                const borrowingInterest = lendingTokenSupplyInfo$.value &&
                  lendingTokenSupplyInfo$.value[stakingToken.address] &&
                  lendingTokenSupplyInfo$.value[stakingToken.address].borrowingInterest

                const lendingAPR = new BigNumber(borrowingInterest)
                  .multipliedBy(utilization / 100)
                  .multipliedBy(1 - PROTOCOL_FEE)
                  .multipliedBy(100)
                  .toNumber()

                return (
                  <LendingPoolListItemCard
                    key={title}
                    selectedAddress={selectedAddress$.value}
                    isExpand={activeIdx == idx}
                    onClick={() => this.setState({ activeIdx: activeIdx == idx ? null : idx })}
                    balanceInWallet={balancesInWallet$.value[stakingToken.address]}
                    ibTokenBalanceInWallet={balancesInWallet$.value[ibTokenAddress]}
                    title={title}
                    stakingToken={stakingToken}
                    vaultAddress={vaultAddress}
                    totalSupply={totalSupply}
                    totalBorrowed={totalBorrowed}
                    ibTokenPrice={ibTokenPrice}
                    depositedTokenBalance={depositedTokenBalance}
                    utilization={utilization}
                    lendingAPR={lendingAPR}
                    stakingAPR={stakingAPR}
                    tvl={tvl}
                  />
                )
              })}
            </div>
          )
        }
      </div>
    )
  }
}

export default LendingPoolList