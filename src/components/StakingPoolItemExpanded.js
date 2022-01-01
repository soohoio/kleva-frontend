import React, { Component, Fragment, createRef } from 'react'
import BigNumber from 'bignumber.js'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import { GT_TOKEN } from 'constants/setting'

import InputWithPercentage from './common/InputWithPercentage'

import Bloc from './StakingPoolItemExpanded.bloc'

import './StakingPoolItemExpanded.scss'
import { selectedAddress$ } from '../streams/wallet'
import { isValidDecimal } from '../utils/calc'

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
      this.bloc.isLoading$,
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

  renderStakeButton = () => {
    const { isApproved, selectedAddress, stakingToken, balanceInWallet } = this.props
    
    if (this.bloc.isLoading$.value) {
      return (
        <button
          className="StakingPoolItemExpanded__stakeButton"
        >
          ...
        </button>
      )
    }
    
    if (isApproved) {

      const isDisabled = !selectedAddress 
        || !this.bloc.stakeAmount$.value
        || new BigNumber(this.bloc.stakeAmount$.value).lte(0)
        || new BigNumber(this.bloc.stakeAmount$.value).gt(balanceInWallet)
        || !isValidDecimal(this.bloc.stakeAmount$.value, stakingToken.decimals)

      return (
        <button
          className={cx("StakingPoolItemExpanded__stakeButton", {
            "StakingPoolItemExpanded__stakeButton--disabled": isDisabled,
          })}
          onClick={() => {
            if (isDisabled) return
            this.bloc.stake(selectedAddress$.value)
          }}
        >
          Stake
        </button>
      )
    }

    return (
      <button
        className="StakingPoolItemExpanded__stakeButton"
        onClick={() => this.bloc.approve(stakingToken)}
      >
        Approve
      </button>
    )
  }
  
  renderUnstakeButton = () => {
    const { isApproved, selectedAddress, stakingToken, depositedAmount } = this.props

    if (this.bloc.isLoading$.value) {
      return (
        <button
          className="StakingPoolItemExpanded__unstakeButton"
        >
          ...
        </button>
      )
    }

    if (isApproved) {

      const isDisabled = !selectedAddress
        || !this.bloc.unstakeAmount$.value
        || new BigNumber(this.bloc.unstakeAmount$.value).lte(0)
        || new BigNumber(this.bloc.unstakeAmount$.value).gt(depositedAmount)
        || !isValidDecimal(this.bloc.unstakeAmount$.value, stakingToken.decimals)

      return (
        <button
          className={cx("StakingPoolItemExpanded__unstakeButton", {
            "StakingPoolItemExpanded__unstakeButton--disabled": isDisabled,
          })}
          onClick={() => {
            if (isDisabled) return
            this.bloc.unstake(selectedAddress$.value)
          }}
        >
          Unstake
        </button>
      )
    }

    return (
      <button
        className="StakingPoolItemExpanded__unstakeButton"
        onClick={() => this.bloc.approve(stakingToken)}
      >
        Approve
      </button>
    )
  }
  
  renderClaimButton = () => {

  }
    
  render() {
    
    const {
      stakingToken,
      balanceInWallet,
      depositedAmount,
      pendingGT,
      klevaPrice,
      card,
      isApproved,
      vaultAddress,
      selectedAddress,
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
            <span className="StakingPoolItemExpanded__availableBalanceValue">{Number(balanceInWallet || 0).toLocaleString('en-us', { maximumFractionDigits: 4 })}</span>
          </div>
          <InputWithPercentage
            className="StakingPoolItemExpanded__stakeInput"
            decimalLimit={stakingToken.decimals}
            value$={this.bloc.stakeAmount$}
            valueLimit={balanceInWallet}
            label={stakingToken.title}
          />
          {this.renderStakeButton()}
        </div>
        <div className="StakingPoolItemExpanded__center">
          <div className="StakingPoolItemExpanded__stakedBalance">
            <span className="StakingPoolItemExpanded__stakedBalanceLabel">Staked {stakingToken.title} Balance</span>
            <span className="StakingPoolItemExpanded__stakedBalanceValue">{depositedAmount && Number(depositedAmount.balanceParsed || 0).toLocaleString('en-us', { maximumFractionDigits: 4 })}</span>
          </div>
          <InputWithPercentage
            decimalLimit={stakingToken.decimals}
            className="StakingPoolItemExpanded__unstakeInput"
            value$={this.bloc.unstakeAmount$}
            valueLimit={depositedAmount && depositedAmount.balanceParsed || 0}
            label={stakingToken.title}
          />
          {this.renderUnstakeButton()}
        </div>
        <div className="StakingPoolItemExpanded__right">
          <p className="StakingPoolItemExpanded__totalRewardsLabel">Earned {GT_TOKEN.title}</p>
          <div className="StakingPoolItemExpanded__totalRewardsValueWrapper">
            <p className="StakingPoolItemExpanded__totalRewardsValue">{Number(pendingGT || 0).toLocaleString('en-us', { maximumFractionDigits: 2 })}</p>
            <p className="StakingPoolItemExpanded__totalRewardsValueInUSD">
              ~ ${new BigNumber(pendingGT || 0)
                .multipliedBy(klevaPrice)
                .toNumber()
                .toLocaleString('en-us', { maximumFractionDigits: 2 })
              }
            </p>
          </div>
          <button 
            className={cx("StakingPoolItemExpanded__claimButton", {
              // "StakingPoolItemExpanded__claimButton--disabled": !selectedAddress,
              "StakingPoolItemExpanded__claimButton--disabled": true,
            })}
            onClick={() => {
              
              // @TODO

              // this.bloc.harvest()
            }}
          >
            {this.bloc.isLoading$.value ? "..." : "Claim"}
          </button>
        </div>
      </div>
    )
  }
}

export default StakingPoolItemExpanded