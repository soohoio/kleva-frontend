import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { debounceTime, takeUntil, tap } from 'rxjs/operators'

import { I18n } from '../common/I18n'

import { tokenPrices$ } from '../../streams/tokenPrice'
import { lendingPools } from '../../constants/lendingpool'
import { lendingTokenSupplyInfo$ } from '../../streams/vault'
import { farmPoolDeposited$ } from '../../streams/farming'
import { currentLocale$ } from 'streams/i18n'

import './Intro2.scss'
import { nFormatter } from '../../utils/misc'

class Intro2 extends Component {

  destroy$ = new Subject()

  componentDidMount() {
    merge(
      currentLocale$,
      tokenPrices$,
      lendingTokenSupplyInfo$,
      farmPoolDeposited$,
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

  getTVL = () => {

    const lendingPoolTVL = lendingPools.reduce((acc, { stakingToken, vaultAddress }) => {

      // Lending Pool TVL Info
      const lendingTokenSupplyInfo = lendingTokenSupplyInfo$.value[vaultAddress]
      const depositedTokenBalance = lendingTokenSupplyInfo && lendingTokenSupplyInfo.depositedTokenBalance

      const tvl = new BigNumber(depositedTokenBalance)
        .multipliedBy(tokenPrices$.value[stakingToken.address.toLowerCase()])
        .toNumber()

      return acc += isNaN(tvl) ? 0 : tvl
    }, 0)

    const farmPoolTVL = farmPoolDeposited$.value && Object.values(farmPoolDeposited$.value).reduce((acc, cur) => {

      const _farmTVL = new BigNumber(cur && cur.deposited)

      return new BigNumber(acc).plus(_farmTVL).toNumber()
    }, 0)

    return new BigNumber(lendingPoolTVL)
      .plus(farmPoolTVL)
      .toNumber()

  }

  render() {

    const _tvl = this.getTVL()

    return (
      <div className="Intro2">
        
        <p className="Intro2__title">{I18n.t('intro2.title')}</p>
        <p className="Intro2__tvl">$
        {_tvl 
          ? Number(_tvl).toLocaleString('en-us', { maximumFractionDigits: 0 })
          : "-"
        }
      </p>
        <p className="Intro2__description">{I18n.t('intro2.description')}</p>
      </div>
    )
  }
}

export default Intro2