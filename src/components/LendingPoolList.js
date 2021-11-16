import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, interval, forkJoin } from 'rxjs'
import { takeUntil, tap, switchMap, startWith } from 'rxjs/operators'
import './LendingPoolList.scss'
import { lendingPools } from '../constants/lendingpool'
import LendingPoolListItem from './LendingPoolListItem'
import { listTokenSupplyInfo$ } from '../streams/contract'
import { lendingTokenSupplyInfo$ } from '../streams/vault'
import { balancesInWallet$ } from '../streams/wallet'
import { isDesktop$ } from '../streams/ui'
import LendingPoolListItemCard from './LendingPoolListItemCard'

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
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })
  }
  
  componentWillUnMount() {
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

                  return (
                    <LendingPoolListItem
                      balanceInWallet={balancesInWallet$.value[stakingToken.address]}
                      ibTokenBalanceInWallet={balancesInWallet$.value[ibTokenAddress]}
                      title={title}
                      stakingToken={stakingToken}
                      vaultAddress={vaultAddress}
                      totalSupply={totalSupply}
                      totalBorrowed={totalBorrowed}
                      ibTokenPrice={ibTokenPrice}
                      depositedTokenBalance={depositedTokenBalance}
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

                return (
                  <LendingPoolListItemCard
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