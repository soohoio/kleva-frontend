import React, { Component, Fragment, createRef } from 'react'
import { groupBy } from 'lodash'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import { stakingPools } from 'constants/stakingpool'

import './StakingPools.scss'
import StakingPoolItem from './StakingPoolItem'
import StakingPoolItemCard from './StakingPoolItemCard'
import { allowancesInStakingPool$, pendingGT$, balancesInStakingPool$, balancesInWallet$, selectedAddress$ } from '../streams/wallet'
import { lendingTokenSupplyInfo$, poolAmountInStakingPool$ } from '../streams/vault'
import { isDesktop$ } from '../streams/ui'
import { klevaAnnualRewards$ } from '../streams/farming'
import { tokenPrices$ } from '../streams/tokenPrice'
import { tokenList } from '../constants/tokens'

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
      klevaAnnualRewards$,
      isDesktop$,
      tokenPrices$,
      poolAmountInStakingPool$,
      selectedAddress$,
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })
  }
  
  componentWillUnMount() {
    this.destroy$.next(true)
  }

  renderStakingPools = ({ stakingToken, vaultAddress, pid, rewardTokens }) => {

    const { selected } = this.state

    const lendingTokenSupplyInfo = lendingTokenSupplyInfo$.value[stakingToken.address]
    const isApproved = (allowancesInStakingPool$.value && allowancesInStakingPool$.value[stakingToken.address] != 0)

    const poolDepositedAmount = poolAmountInStakingPool$.value[pid]

    const klevaAnnualReward = klevaAnnualRewards$.value[pid]
    const klevaPrice = tokenPrices$.value[tokenList.KLEVA.address.toLowerCase()]
    const originalToken = lendingTokenSupplyInfo && lendingTokenSupplyInfo.ibToken.originalToken
    const originalTokenPrice = tokenPrices$.value[originalToken && originalToken.address.toLowerCase()]
    const ibTokenPriceRatio = lendingTokenSupplyInfo && lendingTokenSupplyInfo.ibTokenPrice
    const ibTokenPriceInUSD = originalTokenPrice * ibTokenPriceRatio

    const stakingAPR = new BigNumber(klevaAnnualReward)
      .multipliedBy(klevaPrice)
      .div(poolDepositedAmount * ibTokenPriceInUSD)
      .multipliedBy(100)
      .toNumber()

    return isDesktop$.value
      ? (
        <StakingPoolItem
          key={pid}
          onClick={() => this.setState({
            selected: selected === stakingToken.address
              ? null
              : stakingToken.address
          })}
          pid={pid}
          isExpand={selected === stakingToken.address}
          stakingToken={stakingToken}
          ibTokenPrice={lendingTokenSupplyInfo && lendingTokenSupplyInfo.ibTokenPrice}
          pendingGT={pendingGT$.value[pid]}
          balanceInWallet={balancesInWallet$.value[stakingToken.address]}
          depositedAmount={balancesInStakingPool$.value[stakingToken.address]}
          isApproved={isApproved}
          stakingAPR={stakingAPR}
          klevaPrice={klevaPrice}
          vaultAddress={vaultAddress}
          selectedAddress={selectedAddress$.value}
        />
      )
      : (
        <StakingPoolItemCard
          key={pid}
          onClick={() => this.setState({
            selected: selected === stakingToken.address
              ? null
              : stakingToken.address
          })}
          pid={pid}
          isExpand={selected === stakingToken.address}
          stakingToken={stakingToken}
          ibTokenPrice={lendingTokenSupplyInfo && lendingTokenSupplyInfo.ibTokenPrice}
          pendingGT={pendingGT$.value[pid]}
          balanceInWallet={balancesInWallet$.value[stakingToken.address]}
          depositedAmount={balancesInStakingPool$.value[stakingToken.address]}
          isApproved={isApproved}
          stakingAPR={stakingAPR}
          klevaPrice={klevaPrice}
          vaultAddress={vaultAddress}
          selectedAddress={selectedAddress$.value}
        />
      )
  }
    
  render() {
    const { selected } = this.state

    const { myStaking, availablePools } = groupBy(stakingPools, ({ stakingToken }) => {
      const depositedAmount = balancesInStakingPool$.value[stakingToken.address]
      return depositedAmount && depositedAmount.balanceParsed != 0
        ? 'myStaking'
        : 'availablePools'
    })

    return (
      <div className="StakingPools">
        <p className="StakingPools__title">Staking Pools</p>
        {myStaking && myStaking.length !== 0 && (
          <p className="StakingPools__poolCategory">My Staking ({myStaking.length})</p>
        )}
        {myStaking && myStaking.map((this.renderStakingPools))}
        {availablePools && availablePools.length !== 0 && (
          <p 
            className={cx(
              "StakingPools__poolCategory", {
                "StakingPools__poolCategory--available": true,
                "StakingPools__poolCategory--availableOnly": !myStaking,
              }
            )}>Available Pools ({availablePools.length})</p>
        )}
        {availablePools && availablePools.map((this.renderStakingPools))}
      </div>
    )
  }
}

export default StakingPools