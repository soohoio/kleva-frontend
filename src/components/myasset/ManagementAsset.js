import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of, interval, BehaviorSubject } from 'rxjs'
import { takeUntil, map, tap, debounceTime, startWith, switchMap, filter } from 'rxjs/operators'

import { I18n } from '../common/I18n'

import './ManagementAsset.scss'
import { balancesInStakingPool$, selectedAddress$ } from '../../streams/wallet'
import { lendingTokenSupplyInfo$ } from '../../streams/vault'
import { tokenPrices$ } from '../../streams/tokenPrice'
import { getOriginalTokenFromIbToken, ibTokenByAddress, tokenList } from '../../constants/tokens'
import { getPositionsAll$ } from '../../streams/graphql'
import { getEachTokenBasedOnLPShare } from '../../utils/calc'
import { klayswapPoolInfo$, workerInfo$ } from '../../streams/farming'
import { nFormatter } from '../../utils/misc'
import Guide from '../common/Guide'
import { currentTab$ } from '../../streams/view'

class ManagementAsset extends Component {
  destroy$ = new Subject()
  
  farmingDebtValueTotal$ = new BehaviorSubject(0)
  farmingPositionValueTotal$ = new BehaviorSubject(0)

  componentDidMount() {
    merge(
      klayswapPoolInfo$,
      lendingTokenSupplyInfo$,
      tokenPrices$,
      balancesInStakingPool$,
      workerInfo$,
      this.farmingDebtValueTotal$,
      this.farmingPositionValueTotal$,
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
          switchMap(() => {
            return getPositionsAll$(selectedAddress$.value).pipe(
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

          const farmingPositionValue = new BigNumber(userFarmingTokenAmount)
            .multipliedBy(farmingTokenPrice)
            .plus(
              new BigNumber(userBaseTokenAmount)
                .multipliedBy(baseTokenPrice)
            )
            .toNumber()

          // debt value calculation
          
          const debtValue = new BigNumber(cur.debtAmount)
            .div(10 ** cur.baseToken.decimals)
            .multipliedBy(baseTokenPrice)
            .toNumber()
          
          acc.debtValue = new BigNumber(acc.debtValue).plus(debtValue).toNumber()
          acc.farmingPositionValue = new BigNumber(acc.farmingPositionValue).plus(farmingPositionValue).toNumber()

          return acc
          
        }, { 
          debtValue: 0,
          farmingPositionValue: 0,
        })

        this.farmingDebtValueTotal$.next(result.debtValue)
        this.farmingPositionValueTotal$.next(result.farmingPositionValue)
      }),
      takeUntil(this.destroy$),
    ).subscribe()
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }

  getIbTokenValues = () => {
    return balancesInStakingPool$.value && Object.entries(balancesInStakingPool$.value).reduce((acc, [ibTokenAddress, { balanceParsed }]) => {

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
  }
    
  render() {
    const ibTokenValueTotal = this.getIbTokenValues()
    const debtValueTotal = this.farmingDebtValueTotal$.value
    const farmingPositionValueTotal = this.farmingPositionValueTotal$.value

    const totalManagedAsset = new BigNumber(ibTokenValueTotal)
      .plus(farmingPositionValueTotal)
      .toNumber()

    return (
      <div className="ManagementAsset">
        <div className="ManagementAsset__title">{I18n.t('myasset.management.title')}</div>
        <div className="ManagementAsset__value">
          <p className="ManagementAsset__totalManagedValue">${nFormatter(totalManagedAsset, 2)}</p>
          <p className="ManagementAsset__debt">{I18n.t('borrow')} ${nFormatter(debtValueTotal, 2)}</p>
        </div>
      </div>
    )
  }
}

export default ManagementAsset