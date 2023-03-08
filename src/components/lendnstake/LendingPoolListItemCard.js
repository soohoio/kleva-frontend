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
import LendStakeAPRDetailInfoModal from '../modals/LendStakeAPRDetailInfoModal'
import LendAndStakeControllerPopup from './LendAndStakeControllerPopup';
import ProfitSimulationPopup from './ProfitSimulationPopup'
import ConnectWalletPopup from '../ConnectWalletPopup'
import EnterpriseOnlyModal from '../modals/EnterpriseOnlyModal'

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
      disabled,
      controllerDisabled,
      disabledMessage,
    } = this.props

    const totalAPR = new BigNumber(lendingAPR)
      .plus(stakingAPR)
      .plus(protocolAPR)
      .toNumber()

    const totalAPY = toAPY(totalAPR)

    const ibToken = getIbTokenFromOriginalToken(stakingToken)

    const isDisabled = false
    const isDepositDisabled = balanceInWallet && balanceInWallet.balanceParsed == "0"

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
            {noRounding(totalAPY, 2)}%
            <QuestionMark 
              info
              color="#265FFC" 
              onClick={() => {
                openModal$.next({
                  component: (
                    <LendStakeAPRDetailInfoModal
                      noButton={controllerDisabled}

                      stakingUnavailable={controllerDisabled}

                      isDepositDisabled={isDepositDisabled}
                      
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
          {!disabled && (
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
          )}

          <div className="LendingPoolListItemCard__buttons">
            {controllerDisabled 
              ? disabledMessage 
                ? (
                  (
                    <div
                      className="LendingPoolListItemCard__enterpriseOnly"
                    >
                      {I18n.t(disabledMessage)}
                    </div>
                  )
                )
                : (
                  <div
                    onClick={() => {
                      openModal$.next({
                        component: <EnterpriseOnlyModal />
                      })
                    }}
                    className="LendingPoolListItemCard__enterpriseOnly"
                  >
                    {I18n.t('enterpriseOnly.modal.title')}
                    <QuestionMark />
                  </div>
                )
              : (
                <>
                  <div
                    className={cx("LendingPoolListItemCard__simulationButton", {
                      "LendingPoolListItemCard__simulationButton--disabled": isDisabled
                    })}
                    onClick={() => {

                      if (isDisabled) {
                        return
                      }

                      openModal$.next({
                        classNameAttach: 'Modal--mobileCoverAll',
                        component: (
                          <ProfitSimulationPopup
                            stakingToken={stakingToken}
                            lendingAPR={lendingAPR}
                            stakingAPR={stakingAPR}
                            protocolAPR={protocolAPR}
                          />
                        )
                      })
                    }}
                  >
                    {I18n.t('profitSimulation')}
                  </div>
                  <div
                    className={cx("LendingPoolListItemCard__depositButton", {
                      // @HOTFIX
                      // "LendingPoolListItemCard__depositButton--disabled": isKLAY
                    })}
                    onClick={() => {

                      // @HOTFIX
                      // if (isKLAY) return

                      if (!selectedAddress) {
                        openModal$.next({
                          classNameAttach: "Modal--mobileCoverAll",
                          component: <ConnectWalletPopup />
                        })
                        return
                      }

                      // if (isDepositDisabled) {
                      //   return
                      // }

                      openModal$.next({
                        classNameAttach: 'Modal--mobileCoverAll',
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
                </>
              )
            }
          </div>
        </div>
      </div>
    )
  }
}

export default LendingPoolListItemCard