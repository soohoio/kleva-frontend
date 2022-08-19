import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import Bloc from './LendNStakeAssetList.bloc'
import './LendNStakeAssetList.scss'
import { balancesInStakingPool$, balancesInWallet$ } from '../../streams/wallet'

import { tokenPrices$ } from '../../streams/tokenPrice'
import LendNStakeAssetBrief from './LendNStakeAssetBrief'
import { lendingTokenSupplyInfo$, poolAmountInStakingPool$ } from '../../streams/vault'
import LendNStakeAssetCard from './LendNStakeAssetCard'
import LendNStakeAssetGridItem from './LendNStakeAssetGridItem'
import { I18n } from 'components/common/I18n'
import Guide from '../common/Guide'
import { currentTab$ } from '../../streams/view'

class LendNStakeAssetList extends Component {
  bloc = new Bloc(this)

  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      balancesInWallet$,
      balancesInStakingPool$,
      tokenPrices$,
      lendingTokenSupplyInfo$,
      poolAmountInStakingPool$,
    ).pipe(
      debounceTime(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })
    
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }
    
  render() {
    const { ibTokenBalances, totalInUSD } = this.bloc.getLendNStakeValue()
    
    const isEmpty = ibTokenBalances.length == 0

    return (
      <div className="LendNStakeAssetList">

        {isEmpty 
          ? (
            <Guide
              title={I18n.t('guide.emptyLendNStake.title')}
              description={I18n.t('guide.emptyLendNStake.description')}
              buttonTitle={I18n.t('guide.emptyLendNStake.buttonTitle')}
              onClick={() => {
                currentTab$.next('lendnstake')
              }}
            />
          )
          : (
            <>
              <LendNStakeAssetBrief
                ibTokenBalances={ibTokenBalances}
                totalInUSD={totalInUSD}
              />

              <div className="LendNStakeAssetList__cards">
                {ibTokenBalances.map(({
                  title,
                  address,
                  originalToken,
                  iconSrc,
                  tradeableValue,
                  balanceInWallet,
                  balanceInStaking,
                  balanceTotal,
                  balanceTotalInUSD,
                  stakingPercentage,
                  lendingAPR,
                  stakingAPR,
                  protocolAPR,
                  totalAPR,
                  stakingToken,
                }) => {
                  return (
                    <LendNStakeAssetCard
                      stakingToken={stakingToken}
                      title={title}
                      address={address}
                      iconSrc={iconSrc}
                      tradeableValue={tradeableValue}
                      originalToken={originalToken}
                      balanceInWallet={balanceInWallet}
                      balanceInStaking={balanceInStaking}
                      balanceTotal={balanceTotal}
                      balanceTotalInUSD={balanceTotalInUSD}
                      stakingPercentage={stakingPercentage}
                      lendingAPR={lendingAPR}
                      stakingAPR={stakingAPR}
                      protocolAPR={protocolAPR}
                      totalAPR={totalAPR}
                    />
                  )
                })}
              </div>

              <div className="LendNStakeAssetList__grid">
                <div className="LendNStakeAssetList__gridHeader">
                  <span className="LendNStakeAssetList__gridHeaderItem LendNStakeAssetList__tokenHeader">{I18n.t('token')}</span>
                  <span className="LendNStakeAssetList__gridHeaderItem LendNStakeAssetList__aprapyHeader">{I18n.t('aprapy')}</span>
                  <span className="LendNStakeAssetList__gridHeaderItem LendNStakeAssetList__aprDetailHeader">{I18n.t('aprDetail')}</span>
                  <span className="LendNStakeAssetList__gridHeaderItem LendNStakeAssetList__marketValueHeader">{I18n.t('myasset.marketValue')}</span>
                  <span className="LendNStakeAssetList__gridHeaderItem LendNStakeAssetList__tokenAmountHeader">{I18n.t('myasset.tokenAmount')}</span>
                  <span className="LendNStakeAssetList__gridHeaderItem LendNStakeAssetList__inStakingHeader">{I18n.t('myasset.inStaking')}</span>
                  <span></span>
                  <span></span>
                </div>
                <div className="LendNStakeAssetList__gridContent">

                  {ibTokenBalances.map(({
                    title,
                    address,
                    originalToken,
                    iconSrc,
                    tradeableValue,
                    balanceInWallet,
                    balanceInStaking,
                    balanceTotal,
                    balanceTotalInUSD,
                    stakingPercentage,
                    lendingAPR,
                    stakingAPR,
                    protocolAPR,
                    totalAPR,
                    stakingToken,
                  }) => {
                    return (
                      <LendNStakeAssetGridItem
                        stakingToken={stakingToken}
                        title={title}
                        address={address}
                        iconSrc={iconSrc}
                        tradeableValue={tradeableValue}
                        originalToken={originalToken}
                        balanceInWallet={balanceInWallet}
                        balanceInStaking={balanceInStaking}
                        balanceTotal={balanceTotal}
                        balanceTotalInUSD={balanceTotalInUSD}
                        stakingPercentage={stakingPercentage}
                        lendingAPR={lendingAPR}
                        stakingAPR={stakingAPR}
                        protocolAPR={protocolAPR}
                        totalAPR={totalAPR}
                      />
                    )
                  })}
                </div>
              </div>
            </>
          )
        }

        
      </div>
    )
  }
}

export default LendNStakeAssetList