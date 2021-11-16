import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import { stakingPools } from 'constants/stakingpool'

import './StakingPools.scss'
import StakingPoolItem from './StakingPoolItem'
import StakingPoolItemCard from './StakingPoolItemCard'
import { allowancesInStakingPool$, balancesInStakingPool$, balancesInWallet$ } from '../streams/wallet'
import { lendingTokenSupplyInfo$, pendingGT$ } from '../streams/vault'
import { isDesktop$ } from '../streams/ui'

class StakingPools extends Component {
  destroy$ = new Subject()

  state = {
    selected: null,
  }

  componentDidMount() {
    merge(
      balancesInWallet$,
      balancesInStakingPool$,
      allowancesInStakingPool$,
      lendingTokenSupplyInfo$,
      pendingGT$,
      isDesktop$,
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
    const { selected } = this.state

    return (
      <div className="StakingPools">
        <p className="StakingPools__title">Staking Pools</p>
        {stakingPools.map(({ stakingToken, vaultAddress, pid }) => {

          const lendingTokenSupplyInfo = lendingTokenSupplyInfo$.value[stakingToken.address]
          const isApproved = (allowancesInStakingPool$.value && allowancesInStakingPool$.value[stakingToken.address] != 0)

          
          return isDesktop$.value 
            ? (
              <StakingPoolItem
                onClick={() => this.setState({
                  selected: selected === stakingToken.address
                    ? null
                    : stakingToken.address
                })}
                pid={pid}
                isExpand={selected === stakingToken.address}
                stakingToken={stakingToken}
                ibTokenPrice={lendingTokenSupplyInfo && lendingTokenSupplyInfo.ibTokenPrice}
                pendingGT={pendingGT$.value[stakingToken.address]}
                balanceInWallet={balancesInWallet$.value[stakingToken.address]}
                depositedAmount={balancesInStakingPool$.value[stakingToken.address]}
                isApproved={isApproved}
                vaultAddress={vaultAddress}
              />
            )
            : (
              <StakingPoolItemCard
                onClick={() => this.setState({
                  selected: selected === stakingToken.address
                    ? null
                    : stakingToken.address
                })}
                pid={pid}
                isExpand={selected === stakingToken.address}
                stakingToken={stakingToken}
                ibTokenPrice={lendingTokenSupplyInfo && lendingTokenSupplyInfo.ibTokenPrice}
                pendingGT={pendingGT$.value[stakingToken.address]}
                balanceInWallet={balancesInWallet$.value[stakingToken.address]}
                depositedAmount={balancesInStakingPool$.value[stakingToken.address]}
                isApproved={isApproved}
                vaultAddress={vaultAddress}
              />
            )
        })}
      </div>
    )
  }
}

export default StakingPools