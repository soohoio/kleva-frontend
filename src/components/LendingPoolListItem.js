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
import { isSameAddress, noRounding } from '../utils/misc'
import { protocolAPR$ } from '../streams/farming'
import { I18n } from './common/I18n'

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
          <LabelAndValue
            className="LendingPoolListItem__apy"
            label=""
            value={`${nFormatter(totalAPY, 2)}%`}
          />
          <LabelAndValue 
            className="LendingPoolListItem__apr"
            label="" 
            value={`${nFormatter(totalAPR, 2)}%`} 
          />
        </div>
        <div className="LendingPoolListItem__aprDetail">
          {protocolAPR != 0 && (
            <LabelAndValue
              label={I18n.t('protocolAPR')}
              value={`${Number(protocolAPR || 0).toLocaleString('en-us', { maximumFractionDigits: 2 })}%`}
            />
          )}
          <LabelAndValue
            label={I18n.t('lendingAPR')}
            value={`${nFormatter(lendingAPR, 2)}%`}
          />
          <LabelAndValue
            label={I18n.t('stakingAPR')}
            value={`${nFormatter(stakingAPR, 2)}%`}
          />
        </div>
        
        <div className="LendingPoolListItem LendingPoolListItem--totalSupply">
          <p className="LendingPoolListItem__tokenValue">{noRounding(totalSupply, 0)}</p>
          <p className="LendingPoolListItem__tokenSymbol">{stakingToken.title}</p>
        </div>
        <div className="LendingPoolListItem LendingPoolListItem--utilizationRatio">
          {nFormatter(utilization, 2)}%
        </div>
        <div className="LendingPoolListItem">
          {/* <div className="LendingPoolListItem__tokenBalance">
            <span className="LendingPoolListItem__tokenValue">{Number(ibTokenBalanceInWallet && ibTokenBalanceInWallet.balanceParsed || 0).toLocaleString('en-us', { maximumFractionDigits: 3 })}</span>            
            <span className="LendingPoolListItem__tokenSymbol">ib{stakingToken.title}</span>
          </div>
          {isKLAY && (
            <div className="LendingPoolListItem__tokenBalance">
              <span className="LendingPoolListItem__tokenValue">{Number(wKLAYBalance && wKLAYBalance.balanceParsed || 0).toLocaleString('en-us', { maximumFractionDigits: 3 })} </span>
              <span className="LendingPoolListItem__tokenSymbol">WKLAY</span>
            </div>
          )} */}
          <div className="LendingPoolListItem__tokenBalance">
            <p className="LendingPoolListItem__tokenValue">{Number(balanceInWallet && balanceInWallet.balanceParsed || 0).toLocaleString('en-us', { maximumFractionDigits: 3 })} </p>
            <p className="LendingPoolListItem__tokenSymbol">{stakingToken.title}</p>
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