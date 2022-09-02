import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of, BehaviorSubject, interval } from 'rxjs'
import { filter, takeUntil, tap, debounceTime, switchMap, startWith } from 'rxjs/operators'
import { I18n } from '../common/I18n'

import { contentView$ } from 'streams/ui'

import MyAssetHeader from './MyAssetHeader'
import ThickHR from '../common/ThickHR'

import './MyAsset.scss'
import Tabs from '../common/Tabs'
import LendNStakeAssetList from './LendNStakeAssetList'
import FarmingAssetList from './FarmingAssetList'
import { balancesInStakingPool$, balancesInWallet$, selectedAddress$ } from '../../streams/wallet'
import Guide from '../common/Guide'
import { openModal$ } from '../../streams/ui'
import ConnectWalletPopup from '../ConnectWalletPopup'
import { getOriginalTokenFromIbToken, ibTokenByAddress, ibTokens } from '../../constants/tokens'
import { tokenPrices$ } from '../../streams/tokenPrice'
import { lendingTokenSupplyInfo$ } from '../../streams/vault'
import { currentTab$ } from '../../streams/view'
import { getPositions$ } from '../../streams/graphql'
import { hasPosition$ } from '../../streams/farming'



class MyAsset extends Component {
  destroy$ = new Subject()

  // lendnstake, farming
  assetMenu$ = new BehaviorSubject('lendnstake')

  firstLoading$ = new BehaviorSubject(true)

  componentDidMount() {
    merge(
      contentView$,
      this.firstLoading$,
      this.assetMenu$,
      hasPosition$,
      selectedAddress$,
      balancesInStakingPool$,
      tokenPrices$,
      lendingTokenSupplyInfo$,
    ).pipe(
      debounceTime(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })

    selectedAddress$.pipe(
      filter((account) => !!account),
      switchMap(() => {

        return interval(1000 * 30).pipe(
          startWith(0),
          switchMap(() => getPositions$(selectedAddress$.value, 1))
        )
      }),
      tap((positions) => {
        this.firstLoading$.next(false)
        hasPosition$.next(positions.length != 0)
      }),
      takeUntil(this.destroy$)
    ).subscribe()
  }

  componentWillUnmount() {
    this.destroy$.next(true)
  }

  renderContent = () => {
    if (contentView$.value) {
      return contentView$.value
    }

    if (this.assetMenu$.value === 'lendnstake') {
      return <LendNStakeAssetList />
    }

    return <FarmingAssetList />
  }

  getIbTokenValues = () => {

    const unstakedIbTokenValues = ibTokens && Object.values(ibTokens).reduce((acc, { address, originalToken }) => {

      const { balanceParsed } = balancesInWallet$.value[address]

      const originalTokenPrice = tokenPrices$.value[originalToken.address.toLowerCase()]
      const lendingTokenSupplyInfo = lendingTokenSupplyInfo$.value?.[originalToken.address]
      const ibTokenPrice = lendingTokenSupplyInfo?.ibTokenPrice

      return new BigNumber(acc).plus(
        new BigNumber(originalTokenPrice)
          .multipliedBy(ibTokenPrice)
          .multipliedBy(balanceParsed)
      ).toNumber()
    }, 0)

    const stakedValues = balancesInStakingPool$.value && Object.entries(balancesInStakingPool$.value).reduce((acc, [ibTokenAddress, { balanceParsed }]) => {

      const originalToken = getOriginalTokenFromIbToken(ibTokenByAddress[ibTokenAddress.toLowerCase()])
      const originalTokenPrice = tokenPrices$.value[originalToken.address.toLowerCase()]

      const lendingTokenSupplyInfo = lendingTokenSupplyInfo$.value?.[originalToken.address]

      const ibTokenPrice = lendingTokenSupplyInfo?.ibTokenPrice

      return new BigNumber(acc).plus(
        new BigNumber(originalTokenPrice)
          .multipliedBy(ibTokenPrice)
          .multipliedBy(balanceParsed)
      ).toNumber()
    }, 0)

    return new BigNumber(unstakedIbTokenValues).plus(stakedValues).toNumber()
  }

  render() {

    if (!selectedAddress$.value) {
      return (
        <Guide 
          title={I18n.t('guide.connectWallet.title')}
          buttonTitle={I18n.t('guide.connectWallet.buttonTitle')}
          onClick={() => {
            openModal$.next({
              component: <ConnectWalletPopup />
            })
          }}
        />
      )
    }
    
    if (this.firstLoading$.value) {
      return "..."
    }

    const ibTokenValueTotal = this.getIbTokenValues()

    if (ibTokenValueTotal == 0 && !hasPosition$.value) {
      return (
        <Guide
          title={I18n.t('guide.emptyManagedAsset.title')}
          buttons={[
            {
              title: I18n.t('guide.emptyManagedAsset.buttoneTitle1'),
              onClick: () => {
                currentTab$.next('lendnstake')
              }
            },
            {
              title: I18n.t('guide.emptyManagedAsset.buttoneTitle2'),
              onClick: () => {
                currentTab$.next('farming')
              }
            }
          ]}
        />
      )
    }

    return (
      <>
        {!contentView$.value && (
          <>
            <div className="MyAsset__header">
              <MyAssetHeader />
            </div>
            <ThickHR />
          </>
        )}
        <div className="MyAsset__content">
          {!contentView$.value && (
            <>
              <p className="MyAsset__tabsTitle">{I18n.t('myasset.managementDetail')}</p>
              <Tabs
                className="MyAsset__tabs"
                list={[
                  {
                    title: I18n.t('myasset.asset.lendnstake'),
                    onClick: () => this.assetMenu$.next('lendnstake'),
                    isActive: this.assetMenu$.value === 'lendnstake',
                  },
                  {
                    title: I18n.t('myasset.asset.farming'),
                    onClick: () => this.assetMenu$.next('farming'),
                    isActive: this.assetMenu$.value === 'farming',
                  }
                ]}
              />
            </>
          )}
          {this.renderContent()}
        </div>
      </>
      
    )
  }
}

export default MyAsset