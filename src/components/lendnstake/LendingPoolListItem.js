import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import BigNumber from 'bignumber.js'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'
import { nFormatter } from 'utils/misc'

import './LendingPoolListItem.scss'
import { openModal$ } from '../../streams/ui'
import AssetInfo from '../AssetInfo'
import LabelAndValue from '../LabelAndValue'
import { toAPY } from '../../utils/calc'
import { getIbTokenFromOriginalToken, tokenList } from '../../constants/tokens'
import { isSameAddress, noRounding } from '../../utils/misc'
import { I18n } from '../common/I18n'
import LendAndStakeControllerPopup from './LendAndStakeControllerPopup'
import ProfitSimulationPopup from './ProfitSimulationPopup'
import ConnectWalletPopup from '../ConnectWalletPopup'

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
      isLastIdx,
    } = this.props

    const totalAPR = new BigNumber(lendingAPR)
      .plus(stakingAPR)
      .plus(protocolAPR)
      .toNumber()

    const totalAPY = toAPY(totalAPR)

    const ibToken = getIbTokenFromOriginalToken(stakingToken)

    const isKLAY = isSameAddress(stakingToken.address, tokenList.KLAY.address)

    const isDisabled = false
    const isDepositDisabled = balanceInWallet && balanceInWallet.balanceParsed == "0"  

    return (
      <>
        <div className={cx("LendingPoolListItem", {
          "LendingPoolListItem--last": isLastIdx
        })}>
          <AssetInfo 
            iconSrc={stakingToken && stakingToken.iconSrc} 
            title={title}
            ibTokenPrice={ibTokenPrice}
          />
        </div>
        <div className={cx("LendingPoolListItem", {
          "LendingPoolListItem--last": isLastIdx
        })}>
          <LabelAndValue
            className="LendingPoolListItem__apy"
            label=""
            value={`${noRounding(totalAPY, 2)}%`}
          />
          <LabelAndValue 
            className="LendingPoolListItem__apr"
            label="" 
            value={`${noRounding(totalAPR, 2)}%`} 
          />
        </div>
        <div className={cx("LendingPoolListItem__aprDetail", {
          "LendingPoolListItem__aprDetail--last": isLastIdx,
        })}>
          {protocolAPR != 0 && (
            <LabelAndValue
              label={I18n.t('protocolAPR')}
              value={`${Number(protocolAPR || 0).toLocaleString('en-us', { maximumFractionDigits: 2 })}%`}
            />
          )}
          <LabelAndValue
            label={I18n.t('lendingAPR')}
            value={`${noRounding(lendingAPR, 2)}%`}
          />
          <LabelAndValue
            label={I18n.t('stakingAPR')}
            value={`${noRounding(stakingAPR, 2)}%`}
          />
        </div>
        
        <div className={cx("LendingPoolListItem LendingPoolListItem--totalSupply", {
          "LendingPoolListItem--last": isLastIdx
        })}>
          <p className="LendingPoolListItem__tokenValue">{noRounding(totalSupply, 0)}</p>
          <p className="LendingPoolListItem__tokenSymbol">{stakingToken.title}</p>
        </div>
        <div className={cx("LendingPoolListItem LendingPoolListItem--utilizationRatio", {
          "LendingPoolListItem--last": isLastIdx,
        })}>
          {nFormatter(utilization, 2)}%
        </div>
        <div className={cx("LendingPoolListItem", {
          "LendingPoolListItem--last": isLastIdx
        })}>
          <div className="LendingPoolListItem__tokenBalance">
            <p className="LendingPoolListItem__tokenValue">{Number(balanceInWallet && balanceInWallet.balanceParsed || 0).toLocaleString('en-us', { maximumFractionDigits: 3 })} </p>
            <p className="LendingPoolListItem__tokenSymbol">{stakingToken.title}</p>
          </div>
        </div>
        <div className={cx("LendingPoolListItem", {
          "LendingPoolListItem--last": isLastIdx
        })}>
          <div className="LendingDepositAndSimulation">
            <div
              className={cx("LendingDepositAndSimulation__simulationButton", {
                "LendingDepositAndSimulation__simulationButton--disabled": !lendingAPR || !stakingAPR,
              })}
              onClick={() => {
                if (!lendingAPR || !stakingAPR) return
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
              className={cx("LendingDepositAndSimulation__depositButton", {
                // "LendingDepositAndSimulation__depositButton--disabled": !selectedAddress || isDepositDisabled
              })}
              onClick={() => {

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
          </div>
        </div>
      </>
    )
  }
}

export default LendingPoolListItem