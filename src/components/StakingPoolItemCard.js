import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import './StakingPoolItemCard.scss'
import { GT_TOKEN } from '../constants/setting'
import StakingPoolItemExpanded from './StakingPoolItemExpanded'
import { toAPY } from '../utils/calc'
import { nFormatter } from '../utils/misc'

const StakingAssetInfo = ({ iconSrc, title }) => {
  return (
    <div className="StakingPoolItemCard__StakingAssetInfo">
      <img className="StakingPoolItemCard__StakingAssetInfoIcon" src={iconSrc} />
      <div className="StakingPoolItemCard__StakingAssetInfoInfo">
        <p className="StakingPoolItemCard__StakingAssetInfoTitle">{title}</p>
      </div>
    </div>
  )
}

const APRAPY = ({ apr, apy }) => {
  return (
    <div className="StakingPoolItemCard__APRAPY">
      <p className="StakingPoolItemCard__APRAPYapy">
        <span className="APRAPY__apyLabel">APY</span>
        {nFormatter(apy, 2)}%
      </p>
      <p className="StakingPoolItemCard__APRAPYapr">
        APR {nFormatter(apr, 2)}%
      </p>
    </div>
  )
}

const Staked = ({ stakingToken, amount, ibTokenPrice }) => {

  const InRealTokenAmount = (amount * ibTokenPrice) || 0

  return (
    <div className="StakingPoolItemCard__Staked">
      <p className="StakingPoolItemCard__StakedTitle">Staked {stakingToken.title}</p>
      <div className="StakingPoolItemCard__amountContainer">
        <p className="StakingPoolItemCard__StakedIBTokenAmount">{Number(amount).toLocaleString('en-us', { maximumFractionDigits: 2 })}</p>
        <p className="StakingPoolItemCard__StakedRawTokenAmount">~{Number(InRealTokenAmount).toLocaleString('en-us', { maximumFractionDigits: 2 })} {stakingToken.title.slice(2)}</p>
      </div>
    </div>
  )
}

const Earned = ({ amount, klevaPrice }) => {
  return (
    <div className="StakingPoolItemCard__Earned">
      <p className="StakingPoolItemCard__EarnedTitle">Earned {GT_TOKEN.title}</p>
      <div style={{ textAlign: "right" }}>
        <p className="StakingPoolItemCard__EarnedAmount">
          {Number(amount).toLocaleString('en-us', { maximumFractionDigits: 2 })}
        </p>
        <p className="StakingPoolItem__EarnedAmountInUSD">~ ${
          new BigNumber(amount)
            .multipliedBy(klevaPrice)
            .toNumber()
            .toLocaleString('en-us', { maximumFractionDigits: 2 })
        }</p>
      </div>
    </div>
  )
}

class StakingPoolItemCard extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    
  }
  
  componentWillUnmount() {
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
      <div className={cx("StakingPoolItemCard", {
        "StakingPoolItemCard--expand": isExpand,
      })}>
        <div className="StakingPoolItemCard__contentWrapper">
          <div onClick={onClick} className="StakingPoolItemCard__content">
            <div className="StakingPoolItemCard__contentHeader">
              <StakingAssetInfo
                iconSrc={stakingToken.iconSrc}
                title={stakingToken.title}
              />
              <APRAPY apy={apy} apr={apr} />
            </div>
            <div className="StakingPoolItemCard__contentBody">
              <Staked stakingToken={stakingToken} amount={depositedAmount && depositedAmount.balanceParsed || 0} ibTokenPrice={ibTokenPrice} />
              <Earned amount={pendingGTPure || 0} klevaPrice={klevaPrice} />
            </div>
          </div>
          {isExpand && (
            <StakingPoolItemExpanded
              card
              isApproved={isApproved}
              vaultAddress={vaultAddress}
              pid={pid}
              stakingToken={stakingToken}
              balanceInWallet={balanceInWallet && balanceInWallet.balanceParsed}
              depositedAmount={depositedAmount}
              pendingGT={pendingGTPure}
              klevaPrice={klevaPrice}
              selectedAddress={selectedAddress}
            />
          )}
          <div onClick={onClick} className="StakingPoolItemCard__opener">
            {isExpand
              ? <img className="StakingPoolItemCard__expandIcon" src="/static/images/icon-unexpand.svg" />
              : <img className="StakingPoolItemCard__expandIcon" src="/static/images/icon-expand.svg" />
            }
          </div>
        </div>
      </div>
    )
  }
}

export default StakingPoolItemCard