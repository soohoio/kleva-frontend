import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { interval, Subject, merge, of, BehaviorSubject } from 'rxjs'
import { map, filter, startWith, switchMap, takeUntil, tap, debounceTime } from 'rxjs/operators'

import Bloc from './FarmingAssetList.bloc'
import './FarmingAssetList.scss'
import { balancesInStakingPool$, balancesInWallet$, selectedAddress$ } from '../../streams/wallet'

import { tokenPrices$ } from '../../streams/tokenPrice'
import { lendingTokenSupplyInfo$, poolAmountInStakingPool$ } from '../../streams/vault'
import { I18n } from 'components/common/I18n'

import { getPositionsAll$ } from '../../streams/graphql'
import { getEachTokenBasedOnLPShare, toFixed } from '../../utils/calc'
import { aprInfo$, fetchPositions$, ignorePositionMap$, klayswapPoolInfo$, klevaAnnualRewards$, positions$, workerInfo$ } from '../../streams/farming'
import FarmingAssetBrief from './FarmingAssetBrief'
import { getPositionInfo$ } from '../../streams/contract'
import FarmAssetCard from './FarmAssetCard'
import FarmAssetGridItem from './FarmAssetGridItem'
import Guide from '../common/Guide'
import { currentTab$ } from '../../streams/view'
import { groupBy } from 'lodash'
import KilledCard from './KilledCard'
import KilledGridItem from './KilledGridItem'

class FarmingAssetList extends Component {
  bloc = new Bloc(this)

  destroy$ = new Subject()

  componentDidMount() {
    merge(
      balancesInWallet$,
      balancesInStakingPool$,
      tokenPrices$,
      lendingTokenSupplyInfo$,
      poolAmountInStakingPool$,

      klevaAnnualRewards$,
      klayswapPoolInfo$,
      workerInfo$,
      aprInfo$,
      this.bloc.farmingPositionValueMap$,
      ignorePositionMap$,
    ).pipe(
      debounceTime(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })

    selectedAddress$.pipe(
      filter((account) => !!account),
      switchMap(() => {
        return merge(
          fetchPositions$,
          interval(1000 * 30)
        ).pipe(
          debounceTime(1),
          startWith(0),
          switchMap(() => {
            return getPositionsAll$(selectedAddress$.value).pipe(
              switchMap((positions) => {
                return getPositionInfo$(positions)
              }),
              map((positions) => {

                const positionsAttachedWorkerInfo = positions.map((p) => {
                  const _workerInfo = workerInfo$.value[p.workerAddress.toLowerCase()]
                  return { ...p, ..._workerInfo }
                })

                return positionsAttachedWorkerInfo
              })
            )
          })
        )
      }),
      tap((positions) => {

        positions$.next(positions)

        const result = positions.reduce((acc, cur) => {

          const baseTokenPrice = tokenPrices$.value[cur.baseToken.address.toLowerCase()]
          const farmingTokenPrice = tokenPrices$.value[cur.farmingToken.address.toLowerCase()]

          const lpToken = cur.lpToken
          const poolInfo = klayswapPoolInfo$.value[lpToken && lpToken.address && lpToken.address.toLowerCase()]

          // position value calculation
          const { userFarmingTokenAmount, userBaseTokenAmount } = getEachTokenBasedOnLPShare({
            poolInfo,
            lpShare: cur.lpShare,
            farmingToken: cur.farmingToken,
            baseToken: cur.baseToken,
            totalShare: cur.totalShare,
            totalStakedLpBalance: cur.totalStakedLpBalance,
          })

          const farmingPositionValueInUSD = new BigNumber(userFarmingTokenAmount)
            .multipliedBy(farmingTokenPrice)
            .plus(
              new BigNumber(userBaseTokenAmount)
                .multipliedBy(baseTokenPrice)
            )
            .toNumber()

          acc[lpToken.address] = new BigNumber(acc[lpToken.address] ||0).plus(farmingPositionValueInUSD).toNumber()

          return acc

        }, {})

        this.bloc.farmingPositionValueMap$.next(result)
      }),
      takeUntil(this.destroy$),
    ).subscribe()
  }

  componentWillUnmount() {
    this.destroy$.next(true)
  }

  render() {
    const { sorted, farmingPositionValues, totalInUSD } = this.bloc.getFarmingAssetValue()

    const list = positions$.value

    const isEmpty = list.length == 0 

    const sortedList = list
      .map((positionInfo, idx) => {

        const lpToken = positionInfo.lpToken
        const poolInfo = klayswapPoolInfo$.value[lpToken && lpToken.address && lpToken.address.toLowerCase()]

        // position value calculation
        const { userFarmingTokenAmount, userBaseTokenAmount } = getEachTokenBasedOnLPShare({
          poolInfo,
          lpShare: positionInfo.lpShare,
          farmingToken: positionInfo.farmingToken,
          baseToken: positionInfo.baseToken,
          totalShare: positionInfo.totalShare,
          totalStakedLpBalance: positionInfo.totalStakedLpBalance,
        })

        const baseTokenPrice = tokenPrices$.value[positionInfo.baseToken.address.toLowerCase()]
        const farmingTokenPrice = tokenPrices$.value[positionInfo.farmingToken.address.toLowerCase()]

        const farmingPositionValueInUSD = new BigNumber(userFarmingTokenAmount)
          .multipliedBy(farmingTokenPrice)
          .plus(
            new BigNumber(userBaseTokenAmount)
              .multipliedBy(baseTokenPrice)
          )
          .toNumber()

        const aprInfo = aprInfo$.value[positionInfo.lpToken.address] || aprInfo$.value[positionInfo.lpToken.address.toLowerCase()]
        const workerInfo = workerInfo$.value[positionInfo.workerAddress] || workerInfo$.value[positionInfo.workerAddress.toLowerCase()]

        return {
          positionInfo,
          userFarmingTokenAmount,
          userBaseTokenAmount,
          aprInfo,
          workerInfo,
          farmingPositionValueInUSD,
          ...positionInfo,
        }
      })
      .sort((a, b) => {
        return b?.farmingPositionValueInUSD - a?.farmingPositionValueInUSD
      })

    const killedList = sortedList
      .filter((positionInfo) => {
        return !!positionInfo?.killedTx
          && positionInfo?.positionValue == 0 
          && !ignorePositionMap$.value[positionInfo?.killedTx]
      })

    return (
      <div className="FarmingAssetList">
        {isEmpty 
          ? (
            <Guide
              title={I18n.t('guide.emptyFarming.title')}
              description={I18n.t('guide.emptyFarming.description')}
              buttonTitle={I18n.t('guide.emptyFarming.buttonTitle')}
              onClick={() => {
                currentTab$.next('farming')
              }}
            />
          )
          : (
            <>
              <FarmingAssetBrief
                farmingPositionValues={sorted}
                totalInUSD={totalInUSD}
              />

              <div className="FarmingAssetList__cards">
                {/* killed list */}
                {killedList
                  .map(({
                    positionInfo,
                    userFarmingTokenAmount,
                    userBaseTokenAmount,
                    aprInfo,
                    workerInfo,
                    farmingPositionValueInUSD,
                  }) => {

                    return (
                      <KilledCard
                        key={positionInfo && positionInfo.id}

                        selectedAddress={selectedAddress$.value}

                        userFarmingTokenAmount={userFarmingTokenAmount}
                        userBaseTokenAmount={userBaseTokenAmount}
                        poolInfo={klayswapPoolInfo$.value}
                        lendingTokenSupplyInfo={lendingTokenSupplyInfo$.value}
                        tokenPrices={tokenPrices$.value}
                        klevaAnnualRewards={klevaAnnualRewards$.value}
                        aprInfo={aprInfo}
                        workerInfo={workerInfo}
                        balanceTotalInUSD={farmingPositionValueInUSD}
                        {...positionInfo}
                      />
                    )
                  })
                }
                {sortedList
                  .filter((positionInfo) => positionInfo?.positionValue != 0)
                  .map(({
                    positionInfo,
                    userFarmingTokenAmount,
                    userBaseTokenAmount,
                    aprInfo,
                    workerInfo,
                    farmingPositionValueInUSD,
                  }) => {
                    return (
                      <FarmAssetCard
                        key={positionInfo && positionInfo.id}

                        selectedAddress={selectedAddress$.value}

                        userFarmingTokenAmount={userFarmingTokenAmount}
                        userBaseTokenAmount={userBaseTokenAmount}
                        poolInfo={klayswapPoolInfo$.value}
                        lendingTokenSupplyInfo={lendingTokenSupplyInfo$.value}
                        tokenPrices={tokenPrices$.value}
                        klevaAnnualRewards={klevaAnnualRewards$.value}
                        aprInfo={aprInfo}
                        workerInfo={workerInfo}
                        balanceTotalInUSD={farmingPositionValueInUSD}
                        {...positionInfo}
                      />
                    )
                  })
                }
              </div>

              {killedList.length != 0 && (
                <>
                  <div className="FarmingAssetList__grid FarmingAssetList__grid--killed">
                    <div className="FarmingAssetList__killedAssetInfo">
                      <span className="FarmingAssetList__killedAssetInfoTitle">{I18n.t('liquidatedAsset')}</span>
                      <span className="FarmingAssetList__killedAssetDescription">{I18n.t('liquidatedAsset.description')}</span>
                    </div>
                    <div className="FarmingAssetList__gridHeader">
                      <span className="FarmingAssetList__gridHeaderItem FarmingAssetList__tokenHeader">{I18n.t('pairToken')}</span>
                      <span className="FarmingAssetList__gridHeaderItem FarmingAssetList__aprapyHeader">{I18n.t('isLiquidated')}</span>
                      <span className="FarmingAssetList__gridHeaderItem FarmingAssetList__aprDetailHeader">{I18n.t('farming.summary.totalDeposit')}</span>
                      <span className="FarmingAssetList__gridHeaderItem FarmingAssetList__marketValueHeader">{I18n.t('myasset.farming.repaymentValue')}</span>
                      <span className="FarmingAssetList__gridHeaderItem FarmingAssetList__tokenAmountHeader">{I18n.t('myasset.farming.withdrawnValue')}</span>
                    </div>
                    <div className="FarmingAssetList__gridContent">
                      {killedList
                        .map(({
                          positionInfo,
                          userFarmingTokenAmount,
                          userBaseTokenAmount,
                          aprInfo,
                          workerInfo,
                          farmingPositionValueInUSD,
                        }) => {
                          return (
                            <KilledGridItem
                              key={positionInfo && positionInfo.id}

                              selectedAddress={selectedAddress$.value}

                              userFarmingTokenAmount={userFarmingTokenAmount}
                              userBaseTokenAmount={userBaseTokenAmount}
                              poolInfo={klayswapPoolInfo$.value}
                              lendingTokenSupplyInfo={lendingTokenSupplyInfo$.value}
                              tokenPrices={tokenPrices$.value}
                              klevaAnnualRewards={klevaAnnualRewards$.value}
                              aprInfo={aprInfo}
                              workerInfo={workerInfo}
                              balanceTotalInUSD={farmingPositionValueInUSD}
                              {...positionInfo}
                            />
                          )
                        })
                      }
                    </div>
                  </div>
                </>
              )}
              <div className="FarmingAssetList__grid">

                <div className="FarmingAssetList__gridHeader">
                  <span className="FarmingAssetList__gridHeaderItem FarmingAssetList__tokenHeader">{I18n.t('pairToken')}</span>
                  <span className="FarmingAssetList__gridHeaderItem FarmingAssetList__aprapyHeader">{I18n.t('currentAPR')}</span>
                  <span className="FarmingAssetList__gridHeaderItem FarmingAssetList__aprDetailHeader">{I18n.t('farming.summary.totalDeposit')}</span>
                  <span className="FarmingAssetList__gridHeaderItem FarmingAssetList__marketValueHeader">{I18n.t('myasset.myEquityValue')}</span>
                  <span className="FarmingAssetList__gridHeaderItem FarmingAssetList__tokenAmountHeader">{I18n.t('myasset.debtValueAndDebtRatio')}</span>
                  <span></span>
                </div>

                <div className="FarmingAssetList__gridContent">
                  {sortedList
                    .filter((positionInfo) => positionInfo?.positionValue != 0)
                    .map(({
                      positionInfo,
                      userFarmingTokenAmount,
                      userBaseTokenAmount,
                      aprInfo,
                      workerInfo,
                      farmingPositionValueInUSD,
                    }) => {
                      return (
                        <FarmAssetGridItem
                          key={positionInfo && positionInfo.id}

                          selectedAddress={selectedAddress$.value}

                          userFarmingTokenAmount={userFarmingTokenAmount}
                          userBaseTokenAmount={userBaseTokenAmount}
                          poolInfo={klayswapPoolInfo$.value}
                          lendingTokenSupplyInfo={lendingTokenSupplyInfo$.value}
                          tokenPrices={tokenPrices$.value}
                          klevaAnnualRewards={klevaAnnualRewards$.value}
                          aprInfo={aprInfo}
                          workerInfo={workerInfo}
                          balanceTotalInUSD={farmingPositionValueInUSD}
                          {...positionInfo}
                        />
                      )
                    })
                  }
                </div>
                <div className="FarmAssetList__threshold">
                  <img className="FarmAssetList__thresholdIcon" src="/static/images/exported/warn-mark.svg" />
                  <span className="FarmAssetList__thresholdTitle">{I18n.t('liquidationThreshold')}</span>
                  <span className="FarmAssetList__thresholdDescription">{I18n.t('liquidationThreshold.description')}</span>
                </div>
              </div>
            </>
          )
        }
      </div>
    )
  }
}

export default FarmingAssetList