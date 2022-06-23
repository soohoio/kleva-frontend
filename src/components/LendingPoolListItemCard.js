import React, { Component, Fragment, createRef } from 'react'
import BigNumber from 'bignumber.js'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import AssetInfo from './AssetInfo'
import LabelAndValue from './LabelAndValue'
import { openModal$ } from 'streams/ui'

import { isSameAddress, nFormatter } from '../utils/misc'
import DepositModal from './DepositModal'
import WithdrawModal from './WithdrawModal'

import './LendingPoolListItemCard.scss'
import { toAPY } from '../utils/calc'
import { getIbTokenFromOriginalToken, tokenList } from '../constants/tokens'
import { protocolAPR$ } from '../streams/farming'

class LendingPoolListItemCard extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    
  }
  
  componentWillUnmount() {
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
      utilization,
      lendingAPR,
      stakingAPR,
      protocolAPR,
      selectedAddress,
      wKLAYBalance,
    } = this.props

    const totalAPR = new BigNumber(lendingAPR)
      .plus(stakingAPR)
      .plus(protocolAPR)
      .toNumber()

    const totalAPY = toAPY(totalAPR)

    const ibToken = getIbTokenFromOriginalToken(stakingToken)

    // const isDisabled = isSameAddress(stakingToken.address, tokenList.oUSDT.address)
    const isDisabled = false

    const isKLAY = isSameAddress(stakingToken.address, tokenList.KLAY.address)

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
              value={`${nFormatter(totalAPY, 2)}%`}
            />
            <LabelAndValue
              className="LendingPoolListItemCard__lv LendingPoolListItemCard__lv--apr"
              label="Total APR"
              value={`${nFormatter(totalAPR, 2)}%`}
            />
          </div>
          {isExpand && (
            <>
              <div className="LendingPoolListItemCard__aprDetail">
                {protocolAPR != 0 && (
                  <LabelAndValue
                    label="Protocol APR"
                    value={`${Number(protocolAPR || 0).toLocaleString('en-us', { maximumFractionDigits: 2 })}%`}
                  />
                )}
                <LabelAndValue 
                  className="LendingPoolListItemCard__aprDetailItem" 
                  label="Lending APR" 
                  value={`${nFormatter(lendingAPR, 2)}%`}
                />
                <LabelAndValue 
                  className="LendingPoolListItemCard__aprDetailItem" 
                  label="Staking APR" 
                  value={`${nFormatter(stakingAPR, 2)}%`}
                />
                {/* <LabelAndValue className="LendingPoolListItemCard__aprDetailItem" label="Protocol APR" value="0.0518%" /> */}
              </div>
              <LabelAndValue className="LendingPoolListItemCard__lv LendingPoolListItemCard__lv--supply" label="Total Supply" value={(
                <>
                  {nFormatter(totalSupply, 2)} {stakingToken.title}
                </>
              )} />
              <LabelAndValue className="LendingPoolListItemCard__lv LendingPoolListItemCard__lv--borrowed" label="Total Borrowed" value={(
                <>
                  {nFormatter(totalBorrowed, 2)} {stakingToken.title}
                </>
              )} />
              <LabelAndValue className="LendingPoolListItemCard__lv LendingPoolListItemCard__lv--utilization" label="Utilization" value={(
                <>
                  {utilization.toLocaleString('en-us', { maximumFractionDigits: 2 })}%
                </>
              )} />
              <LabelAndValue className="LendingPoolListItemCard__lv LendingPoolListItemCard__lv--balance" label="My Balance" value={(
                <>
                  <p style={{ textAlign: "right" }}>{Number(ibTokenBalanceInWallet && ibTokenBalanceInWallet.balanceParsed || 0).toLocaleString('en-us', { maximumFractionDigits: 2 })} ib{stakingToken.title}</p>
                  {isKLAY && <p style={{ textAlign: "right" }}>{Number(wKLAYBalance && wKLAYBalance.balanceParsed || 0).toLocaleString('en-us', { maximumFractionDigits: 2 })} WKLAY</p>}
                  <p style={{ textAlign: "right" }}>{Number(balanceInWallet && balanceInWallet.balanceParsed || 0).toLocaleString('en-us', { maximumFractionDigits: 2 })} {stakingToken.title}</p>
                </>
              )} />
              <div className="LendingPoolListItemCard__buttons">
                <button
                  className={cx("LendingPoolListItemCard__withdrawButton", {
                    "LendingPoolListItemCard__withdrawButton--disabled": !selectedAddress || isDisabled
                  })}
                  onClick={() => {

                    if (!selectedAddress || isDisabled) {
                      return
                    }

                    openModal$.next({
                      component: (
                        <WithdrawModal
                          ibTokenPrice={ibTokenPrice}
                          stakingToken={ibToken}
                          vaultAddress={vaultAddress}
                        />
                      )
                    })
                  }}
                >
                  Withdraw
                </button>
                <button
                  className={cx("LendingPoolListItemCard__depositButton", {
                    "LendingPoolListItemCard__depositButton--disabled": !selectedAddress || isDisabled
                  })}
                  onClick={() => {
                    if (!selectedAddress || isDisabled) {
                      return
                    }

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