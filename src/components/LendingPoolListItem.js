import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import BigNumber from 'bignumber.js'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'
import { nFormatter } from 'utils/misc'

import './LendingPoolListItem.scss'
import { openModal$ } from '../streams/ui'
import DepositModal from './DepositModal'
import WithdrawModal from './WithdrawModal'
import AssetInfo from './AssetInfo'
import LabelAndValue from './LabelAndValue'

class LendingPoolListItem extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    
  }
  
  componentWillUnMount() {
    this.destroy$.next(true)
  }
    
  render() {
    const { 
      title, 
      stakingToken, 
      totalSupply, 
      totalBorrowed, 
      depositedTokenBalance, 
      vaultAddress, 
      ibTokenPrice,
      balanceInWallet,
      ibTokenBalanceInWallet,
    } = this.props

    const utilization = new BigNumber(totalBorrowed).div(totalSupply).multipliedBy(100).toNumber()

    return (
      <>
        <div className="LendingPoolListItem">
          <AssetInfo 
            iconSrc={stakingToken && stakingToken.iconSrc} 
            title={title}
            ibTokenPrice={ibTokenPrice}
          />
        </div>
        <div className="LendingPoolListItem">
          <LabelAndValue label="Lending APR" value="-%" />
          <LabelAndValue label="Staking APR" value="-%" />
          <LabelAndValue label="Protocol APR" value="-%" />
          <LabelAndValue label="Total APR" value="-%" />
          <LabelAndValue color="#3369ff" label="Total APY" value="-%" />
        </div>
        <div className="LendingPoolListItem">
          {nFormatter(totalSupply, 2)} {stakingToken.title}
        </div>
        <div className="LendingPoolListItem">
          {nFormatter(totalBorrowed, 2)} {stakingToken.title}
        </div>
        <div className="LendingPoolListItem">
          {utilization.toLocaleString('en-us', { maximumFractionDigits: 2 })}%
        </div>
        <div className="LendingPoolListItem">
          <p>{Number(ibTokenBalanceInWallet && ibTokenBalanceInWallet.balanceParsed).toLocaleString('en-us', { maximumFractionDigits: 2 })} ib{stakingToken.title}</p>
          <p>{Number(balanceInWallet && balanceInWallet.balanceParsed).toLocaleString('en-us', { maximumFractionDigits: 2 })} {stakingToken.title}</p>
        </div>
        <div className="LendingPoolListItem">
          <div className="LendingDepositWithdraw">
            <div 
              className="LendingDepositWithdraw__depositButton"
              onClick={() => openModal$.next({ component: (
                <DepositModal 
                  ibTokenPrice={ibTokenPrice} 
                  stakingToken={stakingToken} 
                  vaultAddress={vaultAddress}
                />
              )})}
            >
              Deposit
            </div>
            <div
              className="LendingDepositWithdraw__withdrawButton"
              onClick={() => openModal$.next({
                component: (
                  <WithdrawModal
                    ibTokenPrice={ibTokenPrice}
                    stakingToken={stakingToken}
                    vaultAddress={vaultAddress}
                  />
                )
              })}
            >
              Withdraw
            </div>
          </div>
        </div>
      </>
    )
  }
}

export default LendingPoolListItem