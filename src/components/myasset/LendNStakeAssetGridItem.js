import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import LabelAndValue from 'components/LabelAndValue'
import QuestionMark from 'components/common/QuestionMark'
import { toAPY } from 'utils/calc'

import './LendNStakeAssetGridItem.scss'
import { nFormatter, noRounding } from '../../utils/misc'
import { openModal$ } from '../../streams/ui'
import LendStakeAPRDetailInfoModal from '../modals/LendStakeAPRDetailInfoModal'
import { I18n } from '../common/I18n'
import SUWController from './SUWController'

class LendNStakeAssetGridItem extends Component {

  destroy$ = new Subject()

  componentDidMount() {
    merge(
      of(true),
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

    const {
      stakingToken,
      title,
      address,
      iconSrc,
      balanceInWallet,
      balanceInStaking,
      balanceTotal,
      balanceTotalInUSD,
      stakingPercentage,
      lendingAPR,
      stakingAPR,
      protocolAPR,
      totalAPR,
      originalToken,
      tradeableValue,
    } = this.props

    const apy = toAPY(totalAPR)

    const isStakingAvailable = balanceInWallet != 0
    const isUnstakingAvailable = balanceInStaking != 0
    const isWithdrawAvailable = balanceInWallet != 0

    return (
      <div className="LendNStakeAssetGridItem">
        <div className="LendNStakeAssetGridItem__asset">
          <div className="LendNStakeAssetGridItem__icon">
            <img src={iconSrc} />
          </div>
          <span className="LendNStakeAssetGridItem__title">{title}</span>
        </div>
        <div className="LendNStakeAssetGridItem__aprapy">
          <LabelAndValue
            className="LendingPoolListItem__apy"
            label=""
            value={`${nFormatter(apy, 2)}%`}
          />
          <LabelAndValue
            className="LendingPoolListItem__apr"
            label=""
            value={`${nFormatter(totalAPR, 2)}%`}
          />
        </div>
        <div className="LendNStakeAssetGridItem__aprDetail">
          {protocolAPR != 0 && (
            <LabelAndValue
              label={I18n.t('protocolAPR')}
              value={`${Number(protocolAPR || 0).toLocaleString('en-us', { maximumFractionDigits: 2 })}%`}
            />
          )}
          <LabelAndValue
            label={I18n.t('lendingAPR')}
            value={`${nFormatter(lendingAPR, 2)}%`}
          />
          <LabelAndValue
            label={I18n.t('stakingAPR')}
            value={`${nFormatter(stakingAPR, 2)}%`}
          />
        </div>
        <div className="LendNStakeAssetGridItem__marketValue">
          ${nFormatter(balanceTotalInUSD, 2)}
        </div>
        <div className="LendNStakeAssetGridItem__tokenAmount">
          <p className="LendNStakeAssetGridItem__tokenAmountValue">{noRounding(balanceTotal, 4)}</p>
          <p className="LendNStakeAssetGridItem__tradeableValue">= {noRounding(tradeableValue, 4)} {originalToken.title}</p>
        </div>
        <div className="LendNStakeAssetGridItem__inStaking">
          <LabelAndValue
            className="LendNStakeAssetGridItem__stakingValue"
            label=""
            value={noRounding(balanceInStaking, 4)}
          />
          <div className="LendNStakeAssetGridItem__gaugeBar">
            <div style={{ width: `${stakingPercentage}%` }} className="LendNStakeAssetGridItem__gauge" />
          </div>
        </div>
        <div className="LendNStakeAssetGridItem__stakingButtons">
          <button
            onClick={() => {
              if (!isStakingAvailable) return
              openModal$.next({
                classNameAttach: "Modal--mobileCoverAll",
                component: (
                  <SUWController
                    stakingToken={stakingToken}
                    mode="staking"
                  />
                )
              })
            }}
            className={cx("LendNStakeAssetGridItem__stake", {
              "LendNStakeAssetGridItem__stake--disabled": !isStakingAvailable
            })}
          >
            {I18n.t('myasset.staking')}
          </button>
          <button
            onClick={() => {
              if (!isUnstakingAvailable) return
              openModal$.next({
                classNameAttach: "Modal--mobileCoverAll",
                component: (
                  <SUWController
                    stakingToken={stakingToken}
                    mode="unstaking"
                  />
                )
              })
            }}
            className={cx("LendNStakeAssetGridItem__unstake", {
              "LendNStakeAssetGridItem__unstake--disabled": !isUnstakingAvailable
            })}
          >
            {I18n.t('myasset.unstaking')}
          </button>
        </div>
        <div className="LendNStakeAssetGridItem__withdrawWrapper">
          <button
            onClick={() => {
              if (!isWithdrawAvailable) return
              openModal$.next({
                classNameAttach: "Modal--mobileCoverAll",
                component: (
                  <SUWController
                    stakingToken={stakingToken}
                    mode="withdraw"
                  />
                )
              })
            }}
            className={cx("LendNStakeAssetGridItem__withdraw", {
              "LendNStakeAssetGridItem__withdraw--disabled": !isWithdrawAvailable
            })}
          >
            {I18n.t('withdraw')}
          </button>
        </div>
      </div>
    )
  }
}

export default LendNStakeAssetGridItem