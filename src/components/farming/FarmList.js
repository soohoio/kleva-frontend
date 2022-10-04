import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { debounceTime, distinctUntilChanged, takeUntil, tap } from 'rxjs/operators'

import './FarmList.scss'
import FarmItemCard from './FarmItemCard'
import FarmItem from './FarmItem'
import { farmPool } from '../../constants/farmpool'
import { aprInfo$, farmPoolDeposited$, farmPoolDepositedByAddress$, klevaAnnualRewards$, workerInfo$ } from '../../streams/farming'
import { lendingTokenSupplyInfo$ } from '../../streams/vault'
import { tokenPrices$ } from '../../streams/tokenPrice'
import { selectedAddress$ } from '../../streams/wallet'
import { isDesktop$ } from '../../streams/ui'
import { BehaviorSubject } from 'rxjs';
import { debtTokens, tokenList } from '../../constants/tokens';
import Opener from '../common/Opener'
import Dropdown from '../common/Dropdown'
import { I18n } from '../common/I18n'
import { lendingPoolsByStakingTokenAddress } from '../../constants/lendingpool';
import { calcKlevaRewardsAPR } from '../../utils/calc'

const defaultBorrowingAssetMap = farmPool.reduce((acc, { lpToken, defaultBorrowingAsset }) => {
  acc[lpToken.address] = defaultBorrowingAsset
  return acc
}, {})

const SORT_KEY_TVL = 'tvl'
const SORT_KEY_YIELD_FARMING_APR = 'yieldFarmingAPR'
const SORT_KEY_2X_LEVERAGE_APR = '2xleverageAPR'

const sortKeyList = [
  { i18nkey: 'sort.tvl', value: SORT_KEY_TVL },
  { i18nkey: 'sort.2xleverageAPR', value: SORT_KEY_2X_LEVERAGE_APR },
  { i18nkey: 'sort.yieldFarmingAPR', value: SORT_KEY_YIELD_FARMING_APR },
]

class FarmList extends Component {
  destroy$ = new Subject()
  // 'tvl', 'yieldFarmingAPR', '2xleverageAPR'
  sortType$ = new BehaviorSubject(sortKeyList[0])
  // 'all', 'wemix', 'klay'
  filterType$ = new BehaviorSubject('all')

  sortTypeChanged$ = merge(
    this.sortType$,
    this.filterType$,
  ).pipe(
    distinctUntilChanged()
  )

  sortCachedAt$ = new BehaviorSubject()
  sorted$ = new BehaviorSubject([])

  borrowingAssetMap$ = new BehaviorSubject(defaultBorrowingAssetMap)

  componentDidMount() {
    merge(
      aprInfo$,
      lendingTokenSupplyInfo$,
      workerInfo$,
      klevaAnnualRewards$,
      tokenPrices$,
      farmPoolDeposited$,
      farmPoolDepositedByAddress$,
      selectedAddress$,
      isDesktop$,
      this.borrowingAssetMap$,
      merge(
        this.sortType$,
        this.filterType$,
      ).pipe(
        distinctUntilChanged(),
        tap(() => {
          this.sortCachedAt$.next(0)
        })
      ),
    ).pipe(
      debounceTime(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })

    merge(
      this.sorted$,
      this.sortCachedAt$,
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe()

    window.sorted$ = this.sorted$
  }

  componentWillUnmount() {
    this.destroy$.next(true)
  }

  // 30s cache
  renderSortCache = (items) => {
  
    const needSortAgain = this.sortCachedAt$.value + 1000 * 60 < new Date().getTime()

    // re-sort
    if (!needSortAgain) {
      return this.sorted$.value
    }

    const sorted = items
      .filter((item) => {
        if (this.filterType$.value === 'all') {
          return true
        }

        if (this.filterType$.value === "wemix") {
          const idx = item.lpToken.ingredients.findIndex(({ address }) => address.toLowerCase() === tokenList.WEMIX.address.toLowerCase())
          return idx != -1
        }

        if (this.filterType$.value === "klay") {
          const idx = item.lpToken.ingredients.findIndex(({ address }) => address.toLowerCase() === tokenList.KLAY.address.toLowerCase())
          return idx != -1
        }
      })
      .map((item, idx) => {

        const token1BorrowingInterest = lendingTokenSupplyInfo$.value[item.token1.address.toLowerCase()]
          && lendingTokenSupplyInfo$.value[item.token1.address.toLowerCase()].borrowingInterest * (2 - 1) // leverage: 2

        const token2BorrowingInterest = lendingTokenSupplyInfo$.value[item.token2.address.toLowerCase()]
          && lendingTokenSupplyInfo$.value[item.token2.address.toLowerCase()].borrowingInterest * (2 - 1) // leverage: 2

        const borrowingAsset = this.borrowingAssetMap$.value[item.lpToken.address]

        const borrowingInterest = borrowingAsset.address.toLowerCase() == item.token1.address.toLowerCase()
          ? token1BorrowingInterest
          : token2BorrowingInterest

        const klevaRewardAPR = calcKlevaRewardsAPR({
          lendingTokenSupplyInfo: lendingTokenSupplyInfo$.value,
          borrowingAsset,
          debtTokens,
          klevaAnnualRewards: klevaAnnualRewards$.value,
          klevaTokenPrice: tokenPrices$.value[tokenList.KLEVA.address.toLowerCase()],
          leverage: 2,
          tokenPrices: tokenPrices$.value,
        })

        return {
          ...item,
          idx,
          borrowingInterest,
          klevaRewardAPR,
        }
      })
      .sort((a, b) => {

        // yield farming apr sort
        if (this.sortType$.value.value == SORT_KEY_TVL) {
          // tvl sort
          const a_farmDeposited = farmPoolDepositedByAddress$.value[a.lpToken.address] || farmPoolDepositedByAddress$.value[a.lpToken.address.toLowerCase()]
          const b_farmDeposited = farmPoolDepositedByAddress$.value[b.lpToken.address] || farmPoolDepositedByAddress$.value[b.lpToken.address.toLowerCase()]

          return (b_farmDeposited && b_farmDeposited.deposited) - (a_farmDeposited && a_farmDeposited.deposited)
        }

        if (this.sortType$.value.value == SORT_KEY_YIELD_FARMING_APR) {
          const a_aprInfo = aprInfo$.value[a.lpToken.address] || aprInfo$.value[a.lpToken.address.toLowerCase()]
          const b_aprInfo = aprInfo$.value[b.lpToken.address] || aprInfo$.value[b.lpToken.address.toLowerCase()]

          const a_yieldFarmingAPR = a_aprInfo &&
            new BigNumber(a_aprInfo.kspMiningAPR || 0)
              .plus(a_aprInfo.airdropAPR || 0)
              .multipliedBy(1)
              .toNumber()

          const b_yieldFarmingAPR = b_aprInfo &&
            new BigNumber(b_aprInfo.kspMiningAPR || 0)
              .plus(b_aprInfo.airdropAPR || 0)
              .multipliedBy(1)
              .toNumber()

          return b_yieldFarmingAPR - a_yieldFarmingAPR
        }
        
        if (this.sortType$.value.value == SORT_KEY_2X_LEVERAGE_APR) {

          const a_aprInfo = aprInfo$.value[a.lpToken.address] || aprInfo$.value[a.lpToken.address.toLowerCase()]
          const b_aprInfo = aprInfo$.value[b.lpToken.address] || aprInfo$.value[b.lpToken.address.toLowerCase()]

          const a_yieldFarmingAPR = a_aprInfo &&
            new BigNumber(a_aprInfo.kspMiningAPR || 0)
              .plus(a_aprInfo.airdropAPR || 0)
              .multipliedBy(2)
              .toNumber()

          const a_tradingFeeAPR = a_aprInfo && new BigNumber(a_aprInfo.tradingFeeAPR || 0)
            .multipliedBy(2)
            .toNumber()

          const a_borrowingInterestAPR = a.borrowingInterest * 1
          const a_klevaRewardAPR = a.klevaRewardAPR

          const a_2xLeverageAPR = new BigNumber(a_yieldFarmingAPR)
            .plus(a_klevaRewardAPR)
            .plus(a_tradingFeeAPR)
            .minus(a_borrowingInterestAPR)
            .toNumber()

          const b_yieldFarmingAPR = b_aprInfo &&
            new BigNumber(b_aprInfo.kspMiningAPR || 0)
              .plus(b_aprInfo.airdropAPR || 0)
              .multipliedBy(2)
              .toNumber()

          const b_tradingFeeAPR = b_aprInfo && new BigNumber(b_aprInfo.tradingFeeAPR || 0)
            .multipliedBy(2)
            .toNumber()

          const b_borrowingInterestAPR = b.borrowingInterest * 1
          const b_klevaRewardAPR = b.klevaRewardAPR

          const b_2xLeverageAPR = new BigNumber(b_yieldFarmingAPR)
            .plus(b_klevaRewardAPR)
            .plus(b_tradingFeeAPR)
            .minus(b_borrowingInterestAPR)
            .toNumber()

          return b_2xLeverageAPR - a_2xLeverageAPR
        }
      })

    this.sorted$.next(sorted)
    this.sortCachedAt$.next(new Date().getTime())
    
    return sorted
  }

  renderFarmItem = ({
    workerList,
    token1,
    token2,
    lpToken,
    tvl,
    exchange,
    yieldFarming,
    tradingFee,
    idx,
  }) => {

    const aprInfo = aprInfo$.value[lpToken.address] || aprInfo$.value[lpToken.address.toLowerCase()]

    const token1BorrowingInterest = lendingTokenSupplyInfo$.value[token1.address.toLowerCase()]
      && lendingTokenSupplyInfo$.value[token1.address.toLowerCase()].borrowingInterest

    const token2BorrowingInterest = lendingTokenSupplyInfo$.value[token2.address.toLowerCase()]
      && lendingTokenSupplyInfo$.value[token2.address.toLowerCase()].borrowingInterest

    if (!isDesktop$.value) {
      return (
        <FarmItemCard
          key={lpToken && lpToken.address}
          sortTypeChanged$={this.sortTypeChanged$}
          klevaAnnualRewards={klevaAnnualRewards$.value}
          tokenPrices={tokenPrices$.value}
          farmDeposited={farmPoolDepositedByAddress$.value[lpToken.address.toLowerCase()]}

          borrowingAssetMap$={this.borrowingAssetMap$}

          aprInfo={aprInfo}
          workerInfo={workerInfo$.value}
          workerList={workerList}
          token1={token1}
          token2={token2}
          lpToken={lpToken}
          tvl={tvl}
          exchange={exchange}
          yieldFarming={yieldFarming}
          tradingFee={tradingFee}

          selectedAddress={selectedAddress$.value}

          lendingTokenSupplyInfo={lendingTokenSupplyInfo$.value}

          token1BorrowingInterest={token1BorrowingInterest}
          token2BorrowingInterest={token2BorrowingInterest}
        />
      )
    }

    return (
      <FarmItem
        key={lpToken && lpToken.address}
        sortTypeChanged$={this.sortTypeChanged$}
        klevaAnnualRewards={klevaAnnualRewards$.value}
        tokenPrices={tokenPrices$.value}
        farmDeposited={farmPoolDepositedByAddress$.value[lpToken.address.toLowerCase()]}

        borrowingAssetMap$={this.borrowingAssetMap$}

        aprInfo={aprInfo}
        workerInfo={workerInfo$.value}
        workerList={workerList}
        token1={token1}
        token2={token2}
        lpToken={lpToken}
        tvl={tvl}
        exchange={exchange}
        yieldFarming={yieldFarming}
        tradingFee={tradingFee}

        selectedAddress={selectedAddress$.value}

        lendingTokenSupplyInfo={lendingTokenSupplyInfo$.value}

        token1BorrowingInterest={token1BorrowingInterest}
        token2BorrowingInterest={token2BorrowingInterest}
      />
    )
  }

  render() {

    return (
      <div className="FarmList">
        <div className="FarmList__header">
          <div className="FarmList__tabs">
            <div 
              className={cx("FarmList__tab", {
                "FarmList__tab--active": this.filterType$.value == 'all',
              })}
              onClick={() => this.filterType$.next('all')}
            >
              {I18n.t('all')}
            </div>
            <div 
              className={cx("FarmList__tab", {
                "FarmList__tab--active": this.filterType$.value == 'wemix',
              })}
              onClick={() => this.filterType$.next('wemix')}
            >
              <img src={tokenList.WEMIX.iconSrc} />
              {tokenList.WEMIX.title}
            </div>
            <div 
              className={cx("FarmList__tab", {
                "FarmList__tab--active": this.filterType$.value == 'klay',
              })}
              onClick={() => this.filterType$.next('klay')}
            >  
              <img src={tokenList.KLAY.iconSrc} />
              {tokenList.KLAY.title}
            </div>
          </div>

          <div className="FarmList__hr" />

          <div className="FarmList__sortDropdownWrapper">
            <Dropdown
              className="FarmList__sortDropdown"
              selectedItem$={this.sortType$}
              items={sortKeyList}
              onSelect={(item) => {
                this.sortType$.next(item)
              }}
            />
            <span className="FarmList__percentageInfo">
              % {I18n.t('apy')}
            </span>
          </div>
          
        </div>
        <div className="FarmList__content">
          {isDesktop$.value && (
            <div className="FarmList__tableHeader">
              <div className="FarmList__pairHeader">{I18n.t('pairToken')}</div>
              <div className="FarmList__aprHeader">{I18n.t('aprapy')}</div>
              <div className="FarmList__aprDetailHeader">{I18n.t('aprDetail')}</div>
              <div className="FarmList__borrowingInterestAPRHeader">{I18n.t('borrowingInterest')}</div>
              <div className="FarmList__tvlHeader">{I18n.t('tvl')}</div>
              <div className="FarmList__leverageHeader">{I18n.t('leverage')}</div>
            </div>
          )}
          
          {farmPoolDeposited$.value 
            && farmPoolDeposited$.value[0]
            && !isNaN(farmPoolDeposited$.value[0].deposited)
            && this.renderSortCache(farmPool).map(({
                workerList,
                token1,
                token2,
                lpToken,
                tvl,
                exchange,
                yieldFarming,
                tradingFee,
                idx,
              }) => {

                return this.renderFarmItem({
                  workerList,
                  token1,
                  token2,
                  lpToken,
                  tvl,
                  exchange,
                  yieldFarming,
                  tradingFee,
                  idx,
                })
              })}
        </div>
      </div>
    )
  }
}

export default FarmList