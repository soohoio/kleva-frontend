import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import { GT_TOKEN } from 'constants/setting'

import StakingPoolItemExpanded from './StakingPoolItemExpanded'

import './StakingPoolItem.scss'
import { allowancesInStakingPool$, selectedAddress$ } from '../streams/wallet'
import { toAPY } from '../utils/calc'

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
      <p className="APRAPY__apy">{Number(apy).toLocaleString('en-us', { maximumFractionDigits: 2 })}%</p>
      <p className="APRAPY__apr">APR {Number(apr).toLocaleString('en-us', { maximumFractionDigits: 2 })}%</p>
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

const Earned = ({ amount }) => {
  return (
    <div className="StakingPoolItem__Earned">
      <p className="StakingPoolItem__EarnedTitle">Earned {GT_TOKEN.title}</p>
      <p className="StakingPoolItem__EarnedAmount">{amount}</p>
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
    const { stakingAPR, isApproved, vaultAddress, isExpand, pid, onClick, stakingToken, balanceInWallet, depositedAmount, ibTokenPrice, pendingGT } = this.props

    const apr = stakingAPR
    const apy = toAPY(apr)

    const pendingGTParsed = Number(pendingGT / 10 ** 18).toLocaleString('en-us', { maximumFractionDigits: 4 })

    return (
      <div 
        className={cx("StakingPoolItem", {
          "StakingPoolItem--expand": isExpand
        })}
      >
        {/* <p className="StakingPoolItem__title">
          Stake {stakingToken && stakingToken.title}, Earn {GT_TOKEN.title}
        </p> */}
        <div className="StakingPoolItem__contentWrapper">
          <div onClick={onClick}  className="StakingPoolItem__content">
            <StakingAssetInfo
              iconSrc={stakingToken.iconSrc}
              title={stakingToken.title}
            />
            <APRAPY apy={apy} apr={apr} />
            <Staked stakingToken={stakingToken} amount={depositedAmount && depositedAmount.balanceParsed} ibTokenPrice={ibTokenPrice} />
            <Earned amount={pendingGTParsed} />
            {isExpand 
              ? <img className="StakingPoolItem__expandIcon" src="/static/images/icon-unexpand.svg" />
              : <img className="StakingPoolItem__expandIcon" src="/static/images/icon-expand.svg" />
            }
          </div>
          {isExpand && (
            <StakingPoolItemExpanded
              isApproved={isApproved}
              vaultAddress={vaultAddress}
              pid={pid}
              stakingToken={stakingToken}
              balanceInWallet={balanceInWallet && balanceInWallet.balanceParsed}
              depositedAmount={depositedAmount}
              pendingGTParsed={pendingGTParsed}
            />
          )}
        </div>
      </div>
    )
  }
}

export default StakingPoolItem