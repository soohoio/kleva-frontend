import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import { GT_TOKEN } from 'constants/setting'

import Bloc from './StakingPoolItemExpanded.bloc'

import './StakingPoolItemExpanded.scss'
import { selectedAddress$ } from '../streams/wallet'

class StakingPoolItemExpanded extends Component {
  destroy$ = new Subject()

  constructor(props) {
    super(props)

    this.bloc = new Bloc(props.stakingToken, props.pid)
  }
  
  componentDidMount() {
    merge(
      this.bloc.stakeAmount$,
      this.bloc.unstakeAmount$,
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
    
  render() {
    
    const {
      stakingToken,
      balanceInWallet,
      depositedAmount,
      pendingGTParsed,
      card,
      isApproved,
      vaultAddress,
    } = this.props

    return (
      <div 
        className={cx("StakingPoolItemExpanded", {
          "StakingPoolItemExpanded--card": card,
        })}
      >
        <div className="StakingPoolItemExpanded__left">
          <div className="StakingPoolItemExpanded__availableBalance">
            <span className="StakingPoolItemExpanded__availableBalanceLabel">Available {stakingToken.title} Balance</span>
            <span className="StakingPoolItemExpanded__availableBalanceValue">{Number(balanceInWallet).toLocaleString('en-us', { maximumFractionDigits: 4 })}</span>
          </div>
          <div 
            className={cx("StakingPoolItemExpanded__inputWrapper", {
              "StakingPoolItemExpanded__inputWrapper--active": this.bloc.stakeAmount$.value !== "",
            })}
          >
            <input 
              className="StakingPoolItemExpanded__input"
              onChange={this.bloc.handleStakeAmountChange}
              value={this.bloc.stakeAmount$.value}
            />
            <button
              className="StakingPoolItemExpanded__maxButton"
              onClick={() => this.bloc.stakeAmount$.next(balanceInWallet)}
            >
              MAX
            </button>
          </div>
          {isApproved 
            ? (
              <button
                className="StakingPoolItemExpanded__stakeButton"
                onClick={() => this.bloc.stake(selectedAddress$.value)}
              >
                Stake
              </button>
            ) :(
              <button 
                className="StakingPoolItemExpanded__stakeButton" 
                onClick={() => this.bloc.approve(stakingToken)}
              >
                Approve
              </button>
          )}
        </div>
        <div className="StakingPoolItemExpanded__center">
          <div className="StakingPoolItemExpanded__stakedBalance">
            <span className="StakingPoolItemExpanded__stakedBalanceLabel">Staked {stakingToken.title} Balance</span>
            <span className="StakingPoolItemExpanded__stakedBalanceValue">{depositedAmount && depositedAmount.balanceParsed}</span>
          </div>
          <div className={cx("StakingPoolItemExpanded__inputWrapper", {
            "StakingPoolItemExpanded__inputWrapper--active": this.bloc.unstakeAmount$.value !== "",
          })}>
            <input 
              className="StakingPoolItemExpanded__input"
              onChange={this.bloc.handleUnstakeAmountChange}
              value={this.bloc.unstakeAmount$.value}
            />
            <button
              className="StakingPoolItemExpanded__maxButton"
              onClick={() => this.bloc.stakeAmount$.next(balanceInWallet)}
            >
              MAX
            </button>
          </div>

          {isApproved
            ? (
              <button
                className="StakingPoolItemExpanded__unstakeButton"
                onClick={() => this.bloc.unstake(selectedAddress$.value)}
              >
                Unstake
              </button>
            ) : (
              <button
                className="StakingPoolItemExpanded__stakeButton"
                onClick={() => this.bloc.approve(stakingToken)}
              >
                Approve
              </button>
            )}
        </div>
        <div className="StakingPoolItemExpanded__right">
          <p className="StakingPoolItemExpanded__totalRewardsLabel">Total {GT_TOKEN.title} Rewards</p>
          <p className="StakingPoolItemExpanded__totalRewardsValue">{pendingGTParsed}</p>
          <button className="StakingPoolItemExpanded__claimButton" onClick={this.bloc.harvest}>Claim</button>
        </div>
      </div>
    )
  }
}

export default StakingPoolItemExpanded