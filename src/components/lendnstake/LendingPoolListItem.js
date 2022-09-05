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

    const isDisabled = false
    const isDepositDisabled = balanceInWallet && balanceInWallet.balanceParsed == "0"  

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
            value={`${noRounding(totalAPY, 2)}%`}
          />
          <LabelAndValue 
            className="LendingPoolListItem__apr"
            label="" 
            value={`${noRounding(totalAPR, 2)}%`} 
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
            value={`${noRounding(lendingAPR, 2)}%`}
          />
          <LabelAndValue
            label={I18n.t('stakingAPR')}
            value={`${noRounding(stakingAPR, 2)}%`}
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
          <div className="LendingPoolListItem__tokenBalance">
            <p className="LendingPoolListItem__tokenValue">{Number(balanceInWallet && balanceInWallet.balanceParsed || 0).toLocaleString('en-us', { maximumFractionDigits: 3 })} </p>
            <p className="LendingPoolListItem__tokenSymbol">{stakingToken.title}</p>
          </div>
        </div>
        <div className="LendingPoolListItem">
          <div className="LendingDepositAndSimulation">
            <div
              className={cx("LendingDepositAndSimulation__simulationButton", {
                "LendingDepositAndSimulation__simulationButton--disabled": !lendingAPR || !stakingAPR,
              })}
              onClick={() => {
                if (!lendingAPR || !stakingAPR) return
                openModal$.next({
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
                "LendingDepositAndSimulation__depositButton--disabled": !selectedAddress || isDepositDisabled
              })}
              onClick={() => {

                if (!selectedAddress) {
                  return
                }

                if (isDepositDisabled) {
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
      </>
    )
  }
}

export default LendingPoolListItem