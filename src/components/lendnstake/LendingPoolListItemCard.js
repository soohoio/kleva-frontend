import React, { Component, Fragment, createRef } from 'react'
import BigNumber from 'bignumber.js'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import AssetInfo from '../AssetInfo'
import LabelAndValue from '../LabelAndValue'
import { openModal$ } from 'streams/ui'

import { isSameAddress, nFormatter, noRounding } from '../../utils/misc'

import './LendingPoolListItemCard.scss'
import { toAPY } from '../../utils/calc'
import { getIbTokenFromOriginalToken, tokenList } from '../../constants/tokens'
import { protocolAPR$ } from '../../streams/farming'
import QuestionMark from '../common/QuestionMark'
import { I18n } from '../common/I18n'
import Modal from '../common/Modal';
import UtilizationInfoModal from '../modals/UtilizationInfoModal';
import APRDetailInfoModal from '../modals/APRDetailInfoModal'
import LendAndStakeControllerPopup from './LendAndStakeControllerPopup';

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

        <div className="LendingPoolListItemCard__header">
          <AssetInfo
            onClick={onClick}
            iconSrc={stakingToken && stakingToken.iconSrc}
            title={title}
            ibTokenPrice={ibTokenPrice}
          />
          <span className="LendingPoolListItemCard__apy">
            {nFormatter(totalAPY, 2)}%
            <QuestionMark 
              info
              color="#265FFC" 
              onClick={() => {
                openModal$.next({
                  component: (
                    <APRDetailInfoModal
                      selectedAddress={selectedAddress}
                      ibToken={ibToken}
                      ibTokenPrice={ibTokenPrice}
                      stakingToken={stakingToken}
                      vaultAddress={vaultAddress}
                      
                      title={stakingToken.title}
                      lendingAPR={lendingAPR}
                      stakingAPR={stakingAPR}
                      protocolAPR={protocolAPR}
                      apr={totalAPR}
                      apy={totalAPY}
                    />
                  )
                })
              }}
            />
          </span>
        </div>
        <div className="LendingPoolListItemCard__content">
          <LabelAndValue 
            className="LendingPoolListItemCard__lv LendingPoolListItemCard__lv--supply" 
            label={I18n.t('totalDeposited')}
            value={(
              <>
                {noRounding(totalSupply, 0)} {stakingToken.title}
              </>
            )} 
          />
          <LabelAndValue 
            className="LendingPoolListItemCard__lv LendingPoolListItemCard__lv--utilization" 
            label={(
              <>
                <span>{I18n.t('utilizationRatio')}</span>
                <QuestionMark
                  color="#AEB3C2"
                  onClick={() => {
                    openModal$.next({
                      component: <UtilizationInfoModal />
                    })
                  }}
                />
              </>
            )}
            value={(
            <>
              {utilization.toLocaleString('en-us', { maximumFractionDigits: 2 })}%
            </>
          )} />
          <LabelAndValue 
            className="LendingPoolListItemCard__lv LendingPoolListItemCard__lv--balance" 
            label={I18n.t('depositAvailable')}
            value={(
            <>
              {/* <p style={{ textAlign: "right" }}>{Number(ibTokenBalanceInWallet && ibTokenBalanceInWallet.balanceParsed || 0).toLocaleString('en-us', { maximumFractionDigits: 2 })} ib{stakingToken.title}</p> */}
              {/* {isKLAY && <p style={{ textAlign: "right" }}>{Number(wKLAYBalance && wKLAYBalance.balanceParsed || 0).toLocaleString('en-us', { maximumFractionDigits: 2 })} WKLAY</p>} */}
              <p style={{ textAlign: "right" }}>{Number(balanceInWallet && balanceInWallet.balanceParsed || 0).toLocaleString('en-us', { maximumFractionDigits: 2 })} {stakingToken.title}</p>
            </>
          )} />

          <div className="LendingPoolListItemCard__buttons">
            <div
              className={cx("LendingPoolListItemCard__simulationButton", {
                "LendingPoolListItemCard__simulationButton--disabled": !selectedAddress || isDisabled
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
              {I18n.t('profitSimulation')}
            </div>
            <div
              className={cx("LendingPoolListItemCard__depositButton", {
                "LendingPoolListItemCard__depositButton--disabled": !selectedAddress || isDisabled
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
                    <LendAndStakeControllerPopup
                      ibToken={ibToken}
                      ibTokenPrice={ibTokenPrice}
                      stakingToken={stakingToken}
                      vaultAddress={vaultAddress}

                      lendingAPR={lendingAPR}
                      stakingAPR={stakingAPR}
                      protocolAPR={protocolAPR}
                    />
                  )
                })
              }}
            >
              {I18n.t('lend')}
            </div>
          </div>
        </div>
        {/* <div className="LendingPoolListItemCard__contentWrapper">
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
          {true && (
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
              </div>
              <LabelAndValue className="LendingPoolListItemCard__lv LendingPoolListItemCard__lv--supply" label="Total Supply" value={(
                <>
                  {nFormatter(totalSupply, 2)} {stakingToken.title}
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
        </div> */}
      </div>
    )
  }
}

export default LendingPoolListItemCard