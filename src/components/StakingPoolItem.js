import React, { Component, Fragment, createRef } from 'react'
import BigNumber from 'bignumber.js'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import { GT_TOKEN } from 'constants/setting'

import StakingPoolItemExpanded from './StakingPoolItemExpanded'

import './StakingPoolItem.scss'
import { allowancesInStakingPool$, selectedAddress$ } from '../streams/wallet'
import { toAPY } from '../utils/calc'
import { nFormatter } from '../utils/misc'

const StakingAssetInfo = ({ iconSrc, title }) => {
  return (
    <div className="StakingAssetInfo">
      <img className="StakingAssetInfo__icon" src={iconSrc} />
      <div className="StakingAssetInfo__info">
        <p className="StakingAssetInfo__title">{title}</p>
      </div>
    </div>
  )
}

const APRAPY = ({ apr, apy }) => {
  return (
    <div className="StakingPoolItem__APRAPY">
      <div className="StakingPoolItem__APRAPYContent">
        <p className="APRAPY__apy">
          <span className="APRAPY__apyLabel">APY</span>
          {nFormatter(apy, 2)}%
        </p>
        <p className="APRAPY__apr">APR {nFormatter(apr, 2)}%</p>
      </div>
    </div>
  )
}

const Staked = ({ stakingToken, amount, ibTokenPrice }) => {

  const InRealTokenAmount = (amount * ibTokenPrice) || 0

  return (
    <div className="StakingPoolItem__Staked">
      <p className="StakingPoolItem__StakedTitle">Staked {stakingToken.title}</p>
      <p className="StakingPoolItem__StakedIBTokenAmount">{Number(amount).toLocaleString('en-us', { maximumFractionDigits: 2 })}</p>
      <p className="StakingPoolItem__StakedRawTokenAmount">~{Number(InRealTokenAmount).toLocaleString('en-us', { maximumFractionDigits: 2 })} {stakingToken.title.slice(2)}</p>
    </div>
  )
}

const Earned = ({ amount, klevaPrice }) => {

  return (
    <div className="StakingPoolItem__Earned">
      <p className="StakingPoolItem__EarnedTitle">Earned {GT_TOKEN.title}</p>
      <p className="StakingPoolItem__EarnedAmount">{Number(amount).toLocaleString('en-us', { maximumFractionDigits: 2 })}</p>
      <p className="StakingPoolItem__EarnedAmountInUSD">~ ${
        new BigNumber(amount)
          .multipliedBy(klevaPrice)
          .toNumber()
          .toLocaleString('en-us', { maximumFractionDigits: 2 })
      }</p>
    </div>
  )
}

class StakingPoolItem extends Component {
  destroy$ = new Subject()


  componentDidMount() {
    
  }
  
  componentWillUnMount() {
    this.destroy$.next(true)
  }
    
  render() {
    const { 
      stakingAPR, 
      isApproved, 
      vaultAddress, 
      isExpand, 
      pid, 
      onClick, 
      stakingToken, 
      balanceInWallet, 
      depositedAmount, 
      ibTokenPrice, 
      klevaPrice,
      pendingGT,
      selectedAddress,
    } = this.props

    const apr = stakingAPR
    const apy = toAPY(apr)

    const pendingGTPure = Number(pendingGT / 10 ** 18)

    return (
      <div 
        className={cx("StakingPoolItem", {
          "StakingPoolItem--expand": isExpand
        })}
      >
        <div className="StakingPoolItem__contentWrapper">
          <div onClick={onClick}  className="StakingPoolItem__content">
            <StakingAssetInfo
              iconSrc={stakingToken.iconSrc}
              title={stakingToken.title}
            />
            <APRAPY apy={apy} apr={apr} />
            <Staked stakingToken={stakingToken} amount={depositedAmount && depositedAmount.balanceParsed || 0} ibTokenPrice={ibTokenPrice} />
            <Earned klevaPrice={klevaPrice} amount={pendingGTPure || 0} />
            <div className="StakingPoolItem__expandItem">
              {isExpand 
                ? <img className="StakingPoolItem__expandIcon" src="/static/images/icon-unexpand.svg" />
                : <img className="StakingPoolItem__expandIcon" src="/static/images/icon-expand.svg" />
              }
            </div>
          </div>
          {isExpand && (
            <StakingPoolItemExpanded
              selectedAddress={selectedAddress}
              isApproved={isApproved}
              vaultAddress={vaultAddress}
              pid={pid}
              stakingToken={stakingToken}
              balanceInWallet={balanceInWallet && balanceInWallet.balanceParsed}
              depositedAmount={depositedAmount}
              pendingGT={pendingGTPure}
              klevaPrice={klevaPrice}
            />
          )}
        </div>
      </div>
    )
  }
}

export default StakingPoolItem