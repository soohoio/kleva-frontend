import React, { Component, Fragment, createRef } from 'react'
import BigNumber from 'bignumber.js'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import AssetInfo from './AssetInfo'
import LabelAndValue from './LabelAndValue'
import { openModal$ } from 'streams/ui'

import { nFormatter } from '../utils/misc'
import DepositModal from './DepositModal'
import WithdrawModal from './WithdrawModal'

import './LendingPoolListItemCard.scss'

class LendingPoolListItemCard extends Component {
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
      isExpand,
      onClick,
    } = this.props

    const utilization = new BigNumber(totalBorrowed).div(totalSupply).multipliedBy(100).toNumber()

    return (
      <div className="LendingPoolListItemCard">
        <AssetInfo
          onClick={onClick}
          iconSrc={stakingToken && stakingToken.iconSrc}
          title={title}
          ibTokenPrice={ibTokenPrice}
        />
        <div className="LendingPoolListItemCard__contentWrapper">
          <div onClick={onClick} className="LendingPoolListItemCard__content">
            <LabelAndValue
              className="LendingPoolListItemCard__lv LendingPoolListItemCard__lv--apy"
              label="Total APY"
              value="-%"
            />
            <LabelAndValue
              className="LendingPoolListItemCard__lv LendingPoolListItemCard__lv--apr"
              label="Total APR"
              value="-%"
            />
          </div>
          {isExpand && (
            <>
              <div className="LendingPoolListItemCard__aprDetail">
                <LabelAndValue className="LendingPoolListItemCard__aprDetailItem" label="Lending APR" value="0.0518%" />
                {/* <LabelAndValue className="LendingPoolListItemCard__aprDetailItem" label="Staking APR" value="0.0518%" /> */}
                {/* <LabelAndValue className="LendingPoolListItemCard__aprDetailItem" label="Protocol APR" value="0.0518%" /> */}
              </div>
              <LabelAndValue className="LendingPoolListItemCard__lv LendingPoolListItemCard__lv--supply" label="Total Supply" value={(
                <>
                  {nFormatter(totalSupply, 6)} {stakingToken.title}
                </>
              )} />
              <LabelAndValue className="LendingPoolListItemCard__lv LendingPoolListItemCard__lv--borrowed" label="Total Borrowed" value={(
                <>
                  {nFormatter(totalBorrowed, 6)} {stakingToken.title}
                </>
              )} />
              <LabelAndValue className="LendingPoolListItemCard__lv LendingPoolListItemCard__lv--utilization" label="Utilization" value={(
                <>
                  {utilization.toLocaleString('en-us', { maximumFractionDigits: 2 })}%
                </>
              )} />
              <LabelAndValue className="LendingPoolListItemCard__lv LendingPoolListItemCard__lv--balance" label="My Balance" value={(
                <>
                  <p style={{ textAlign: "right" }}>{Number(ibTokenBalanceInWallet && ibTokenBalanceInWallet.balanceParsed).toLocaleString('en-us', { maximumFractionDigits: 2 })} ib{stakingToken.title}</p>
                  <p style={{ textAlign: "right" }}>{Number(balanceInWallet && balanceInWallet.balanceParsed).toLocaleString('en-us', { maximumFractionDigits: 2 })} {stakingToken.title}</p>
                </>
              )} />
              <div className="LendingPoolListItemCard__buttons">
                <button
                  className="LendingPoolListItemCard__withdrawButton"
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
                </button>
                <button
                  className="LendingPoolListItemCard__depositButton"
                  onClick={() => {
                    openModal$.next({
                      component: (
                        <DepositModal
                          ibTokenPrice={ibTokenPrice}
                          stakingToken={stakingToken}
                          vaultAddress={vaultAddress}
                        />
                      )
                    })
                  }}
                >
                  Deposit
                </button>
              </div>
            </>
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

export default LendingPoolListItemCard