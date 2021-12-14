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
import { toAPY } from '../utils/calc'

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
      lendingAPR,
      vaultAddress, 
      ibTokenPrice,
      balanceInWallet,
      ibTokenBalanceInWallet,
      utilization,
    } = this.props

    const totalAPR = lendingAPR

    const totalAPY = toAPY(totalAPR)

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
          <LabelAndValue label="Lending APR" value={`${Number(lendingAPR).toLocaleString('en-us', { maximumFractionDigits:2 })}%`} />
          {/* <LabelAndValue label="Staking APR" value="-%" /> */}
          <LabelAndValue label="Total APR" value={`${Number(totalAPR).toLocaleString('en-us', { maximumFractionDigits: 2 })}%`} />
          <LabelAndValue color="#3369ff" label="Total APY" value={`${Number(totalAPY).toLocaleString('en-us', { maximumFractionDigits: 2 })}%`} />
        </div>
        <div className="LendingPoolListItem">
          {nFormatter(totalSupply, 6)} {stakingToken.title}
        </div>
        <div className="LendingPoolListItem">
          {nFormatter(totalBorrowed, 6)} {stakingToken.title}
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