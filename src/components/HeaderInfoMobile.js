import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import './HeaderInfoMobile.scss'
import { tokenPrices$ } from '../streams/tokenPrice'
import { path$ } from '../streams/location'
import { tokenList } from '../constants/tokens'

import { lendingPools } from '../constants/lendingpool'
import { lendingTokenSupplyInfo$ } from '../streams/vault'
import { farmPoolDeposited$ } from '../streams/farming'
import { range } from 'lodash'
import RollingBanner from './RollingBanner'

const Item = ({ imgSrc, title, value }) => {
  return (
    <div className="HeaderInfoMobile__item">
      {imgSrc && <img className="HeaderInfoMobile__itemImage" src={imgSrc} />}
      <span className="HeaderInfoMobile__itemTitle">{title}</span>
      <span className="HeaderInfoMobile__itemValue">{value}</span>
    </div>
  )
}

const MarketingBannerItem = ({
  imgSrc,
  title,
}) => {
  return (
    <div className="MarketingBannerItem">
      {title}
    </div>
  )
}

const bannerItems = [{
  imgSrc: '',
  title: 'Marketing Communcation Banners',
}]

class HeaderInfoMobile extends Component {
  destroy$ = new Subject()
  
  state = {
    activeBannerIdx: 0,
  }

  componentDidMount() {
    merge(
      path$,
      tokenPrices$,
      lendingTokenSupplyInfo$,
      farmPoolDeposited$,
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })
  }
  
  componentWillUnMount() {
    this.destroy$.next(true)
  }

  getTVL = () => {

    const lendingPoolTVL = lendingPools.reduce((acc, { stakingToken, vaultAddress }) => {

      // Lending Pool TVL Info
      const lendingTokenSupplyInfo = lendingTokenSupplyInfo$.value[vaultAddress]
      const depositedTokenBalance = lendingTokenSupplyInfo && lendingTokenSupplyInfo.depositedTokenBalance
      const totalUnborrowed = lendingTokenSupplyInfo && lendingTokenSupplyInfo.totalUnborrowed

      const tvl = new BigNumber(depositedTokenBalance)
        .multipliedBy(tokenPrices$.value[stakingToken.address.toLowerCase()])
        .toNumber()

      return acc += isNaN(tvl) ? 0 : tvl
    }, 0)

    const farmPoolTVL = farmPoolDeposited$.value && Object.values(farmPoolDeposited$.value).reduce((acc, cur) => {

      const _farmTVL = new BigNumber(cur && cur.deposited)
        .multipliedBy(tokenPrices$.value[cur && cur.lpToken && cur.lpToken.address.toLowerCase()])

      return new BigNumber(acc).plus(_farmTVL).toNumber()
    }, 0)

    return new BigNumber(lendingPoolTVL)
      .plus(farmPoolTVL)
      .toNumber()
  }
    
  render() {
    const { activeBannerIdx } = this.state

    const klevaPrice = tokenPrices$.value && tokenPrices$.value[tokenList.KLEVA.address.toLowerCase()]
    const tvl = this.getTVL()

    return (
      <>
        <div className="HeaderInfoMobile">
          <div className="HeaderInfoMobile__top">
            <div className="HeaderInfoMobile__item">
              <span className="HeaderInfoMobile__itemTitle">Total Value Locked</span>
              <span className="HeaderInfoMobile__itemValue">${Number(tvl).toLocaleString('en-us', { maximumFractionDigits: 2 })}</span>
            </div>
            <div className="HeaderInfoMobile__item">
              <div className="HeaderInfoMobile__itemLeft">
                <div className="HeaderInfoMobile__itemImage" />
                <span className="HeaderInfoMobile__itemTitle">KLEVA</span>
              </div>
              <span className="HeaderInfoMobile__itemValue">${Number(klevaPrice).toLocaleString('en-us', { maximumFractionDigits: 2 })}</span>
            </div>
          </div>
          <div className="HeaderInfoMobile__developedByWrapper">
            <span className="HeaderInfoMobile__developedBy">Developed by</span>
            <div className="HeaderInfoMobile__images"> 
              <img className="HeaderInfoMobile__developedTeamIcon" src="/static/images/logo-wmt@3x.png" />
              <div className="HeaderInfoMobile__circle" />
              <img className="HeaderInfoMobile__developedTeamIcon" src="/static/images/logo-sooho@3x.png" />
              <div className="HeaderInfoMobile__circle" />
              <img className="HeaderInfoMobile__developedTeamIcon" src="/static/images/logo-bos@3x.png" />
            </div>
          </div>
        </div>
        
        <RollingBanner leftRight />
        {/* <div className={cx("MarketingBanners", {
          "MarketingBanners--show": path$.value === '/' || path$.value === '/lend',
        })}>
          {bannerItems.map(({ title, imgSrc }) => {
            return <MarketingBannerItem key={imgSrc} title={title} imgSrc={imgSrc} />
          })}
          {range(bannerItems.length).map((idx) => {
            return <div key={idx} className={cx("MarketingBanners__circle", {
              "MarketingBanners__circle--active": idx === activeBannerIdx,
            })} />
          })}
        </div> */}
      </>
    )
  }
}

export default HeaderInfoMobile