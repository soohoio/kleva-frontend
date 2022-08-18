import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import Bloc from './LendNStakeAssetList.bloc'
import './LendNStakeAssetList.scss'
import { balancesInStakingPool$, balancesInWallet$ } from '../../streams/wallet'
import { getOriginalTokenFromIbToken, ibTokenByAddress, ibTokens } from '../../constants/tokens'
import { tokenPrices$ } from '../../streams/tokenPrice'
import LendNStakeAssetBrief from './LendNStakeAssetBrief'
import { lendingTokenSupplyInfo$ } from '../../streams/vault'

class LendNStakeAssetList extends Component {
  bloc = new Bloc(this)

  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      balancesInWallet$,
      balancesInStakingPool$,
      tokenPrices$,
      lendingTokenSupplyInfo$,
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

  getLendNStakeValue = () => {
    const ibTokenBalances = ibTokens && Object.values(ibTokens).reduce((acc, cur) => {
      const balanceInWallet = balancesInWallet$.value[cur.address] && balancesInWallet$.value[cur.address].balanceParsed
      const balanceInStaking = balancesInStakingPool$.value[cur.address] && balancesInStakingPool$.value[cur.address].balanceParsed
      const balanceTotal = new BigNumber(balanceInWallet).plus(balanceInStaking).toNumber()

      const originalToken = getOriginalTokenFromIbToken(ibTokenByAddress[cur.address.toLowerCase()])
      const originalTokenPrice = tokenPrices$.value[originalToken.address.toLowerCase()]

      const lendingTokenSupplyInfo = lendingTokenSupplyInfo$.value?.[originalToken.address]

      const ibTokenPrice = lendingTokenSupplyInfo?.ibTokenPrice

      const balanceTotalInUSD = new BigNumber(balanceTotal)
        .multipliedBy(originalTokenPrice)
        .multipliedBy(ibTokenPrice)
        .toNumber()

      // accumulate which has balances
      if (balanceTotal == 0 || isNaN(balanceTotal)) return acc

      acc.push({
        ...cur,
        balanceInWallet,
        balanceInStaking,
        balanceTotalInUSD,
      })

      return acc
    }, [])

    const totalInUSD = ibTokenBalances.reduce((acc, cur) => {
      return new BigNumber(acc).plus(cur.balanceTotalInUSD).toNumber()
    }, 0)

    return {
      ibTokenBalances,
      totalInUSD,
    }
  }
    
  render() {
    const { ibTokenBalances, totalInUSD } = this.getLendNStakeValue()
    
    return (
      <div className="LendNStakeAssetList">
        <LendNStakeAssetBrief
          ibTokenBalances={ibTokenBalances}
          totalInUSD={totalInUSD}
        />
      </div>
    )
  }
}

export default LendNStakeAssetList