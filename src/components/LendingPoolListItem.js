import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import BigNumber from 'bignumber.js'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'
import { nFormatter } from 'utils/misc'

import './LendingPoolListItem.scss'
import { openModal$ } from '../streams/ui'
import ConnectWallet from './ConnectWallet'
import DepositModal from './DepositModal'
import WithdrawModal from './WithdrawModal'
import AssetInfo from './AssetInfo'
import LabelAndValue from './LabelAndValue'
import { toAPY } from '../utils/calc'
import ConnectWalletPopup from './ConnectWalletPopup'
import { getIbTokenFromOriginalToken, tokenList } from '../constants/tokens'
import { isSameAddress } from '../utils/misc'
import { protocolAPR$ } from '../streams/farming'

class LendingPoolListItem extends Component {
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
      lendingAPR,
      vaultAddress, 
      ibTokenPrice,
      balanceInWallet,
      ibTokenBalanceInWallet,
      utilization,
      stakingAPR,
      protocolAPR,
      tvl,
      selectedAddress,
      wKLAYBalance,
    } = this.props

    const totalAPR = new BigNumber(lendingAPR)
      .plus(stakingAPR)
      .plus(protocolAPR)
      .toNumber()

    const totalAPY = toAPY(totalAPR)

    const ibToken = getIbTokenFromOriginalToken(stakingToken)

    const isKLAY = isSameAddress(stakingToken.address, tokenList.KLAY.address)

    // const isDisabled = isSameAddress(stakingToken.address, tokenList.oUSDT.address)
    const isDisabled = false

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
          {protocolAPR != 0 && (
            <LabelAndValue
              label="Protocol APR"
              value={`${Number(protocolAPR || 0).toLocaleString('en-us', { maximumFractionDigits: 2 })}%`}
            />
          )}
          <LabelAndValue 
            label="Lending APR" 
            value={`${nFormatter(lendingAPR, 0)}%`} 
          />
          <LabelAndValue 
            label="Staking APR" 
            value={`${nFormatter(stakingAPR, 0)}%`}
          />
          <LabelAndValue 
            label="Total APR" 
            value={`${nFormatter(totalAPR, 0)}%`} 
          />
          <LabelAndValue 
            color="#3369ff" 
            label="Total APY" 
            value={`${nFormatter(totalAPY, 0)}%`}
          />
        </div>
        <div className="LendingPoolListItem LendingPoolListItem--totalSupply">
          <span className="LendingPoolListItem__tokenValue">{nFormatter(totalSupply, 2)} </span>
          <span className="LendingPoolListItem__tokenSymbol">{stakingToken.title}</span>
        </div>
        <div className="LendingPoolListItem LendingPoolListItem--totalBorrowed">
          <span className="LendingPoolListItem__tokenValue">{nFormatter(totalBorrowed, 2)}</span>
          <span className="LendingPoolListItem__tokenSymbol">{stakingToken.title}</span>
        </div>
        <div className="LendingPoolListItem">
          {nFormatter(utilization, 2)}%
        </div>
        <div className="LendingPoolListItem">
          <div className="LendingPoolListItem__tokenBalance">
            <span className="LendingPoolListItem__tokenValue">{Number(ibTokenBalanceInWallet && ibTokenBalanceInWallet.balanceParsed || 0).toLocaleString('en-us', { maximumFractionDigits: 3 })}</span>            
            <span className="LendingPoolListItem__tokenSymbol">ib{stakingToken.title}</span>
          </div>
          {isKLAY && (
            <div className="LendingPoolListItem__tokenBalance">
              <span className="LendingPoolListItem__tokenValue">{Number(wKLAYBalance && wKLAYBalance.balanceParsed || 0).toLocaleString('en-us', { maximumFractionDigits: 3 })} </span>
              <span className="LendingPoolListItem__tokenSymbol">WKLAY</span>
            </div>
          )}
          <div className="LendingPoolListItem__tokenBalance">
            <span className="LendingPoolListItem__tokenValue">{Number(balanceInWallet && balanceInWallet.balanceParsed || 0).toLocaleString('en-us', { maximumFractionDigits: 3 })} </span>
            <span className="LendingPoolListItem__tokenSymbol">{stakingToken.title}</span>
          </div>
        </div>
        <div className="LendingPoolListItem">
          <div className="LendingDepositWithdraw">
            <div
              className={cx("LendingDepositWithdraw__depositButton", {
                "LendingDepositWithdraw__depositButton--disabled": !selectedAddress || isDisabled
              })}
              onClick={() => {

                if (!selectedAddress) {
                  return
                }

                if (isDisabled) {
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
            </div>
            <div
              className={cx("LendingDepositWithdraw__withdrawButton", {
                "LendingDepositWithdraw__withdrawButton--disabled": !selectedAddress || isDisabled
              })}
              onClick={() => {
                if (!selectedAddress) {
                  return
                }

                if (isDisabled) {
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
            </div>
          </div>
        </div>
      </>
    )
  }
}

export default LendingPoolListItem