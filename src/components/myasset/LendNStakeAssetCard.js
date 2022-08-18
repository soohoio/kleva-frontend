import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import LabelAndValue from 'components/LabelAndValue'
import QuestionMark from 'components/common/QuestionMark'
import { toAPY } from 'utils/calc'

import Bloc from './LendNStakeAssetCard.bloc'
import './LendNStakeAssetCard.scss'
import { nFormatter, noRounding } from '../../utils/misc'
import { openModal$ } from '../../streams/ui'
import LendStakeAPRDetailInfoModal from '../modals/LendStakeAPRDetailInfoModal'
import { I18n } from '../common/I18n'
import SUWController from './SUWController'

class LendNStakeAssetCard extends Component {
  bloc = new Bloc(this)

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
      <div className="LendNStakeAssetCard">
        <div className="LendNStakeAssetCard__icon">
          <img src={iconSrc} />
        </div>
        <div className="LendNStakeAssetCard__content">
          <LabelAndValue 
            className="LendNStakeAssetCard__contentHeader"
            label={title}
            value={(
              <>
                <QuestionMark
                  info
                  size="14px"
                  color="#5C86FA"
                  title={`${nFormatter(apy, 2)}%`}
                  onClick={() => {
                    openModal$.next({
                      component: <LendStakeAPRDetailInfoModal 
                        noButton
                        title={title}
                        lendingAPR={lendingAPR}
                        stakingAPR={stakingAPR}
                        protocolAPR={protocolAPR}
                        apr={totalAPR}
                        apy={apy}
                      />
                    })
                  }}
                />
              </>
            )}
          />
          <LabelAndValue 
            className="LendNStakeAssetCard__marketValue"
            label={I18n.t('myasset.marketValue')}
            value={`$${nFormatter(balanceTotalInUSD, 2)}`}
          />
          <LabelAndValue 
            className="LendNStakeAssetCard__tokenAmount"
            label={(
              <>
                <p className="LendNStakeAssetCard__tokenAmountTitle">{I18n.t('myasset.tokenAmount')}</p>
                <p className="LendNStakeAssetCard__tokenAmountSubtitle">{I18n.t('myasset.tradeValue', { token: originalToken.title })}</p>
              </>
            )}
            value={(
              <>
                <p className="LendNStakeAssetCard__tokenAmountValue">{noRounding(balanceTotal, 4)}</p>
                <p className="LendNStakeAssetCard__tradeableValue">= {noRounding(tradeableValue, 4)} {originalToken.title}</p>
              </>
            )}
          />
          <LabelAndValue 
            className="LendNStakeAssetCard__stakingValue"
            label={I18n.t('myasset.inStaking')}
            value={noRounding(balanceInStaking, 4)}
          />
          <div className="LendNStakeAssetCard__gaugeBar">
            <div style={{ width: `${stakingPercentage}%` }} className="LendNStakeAssetCard__gauge" />
          </div>
          <div className="LendNStakeAssetCard__stakingButtons">
            <button
              onClick={() => {
                if (!isUnstakingAvailable) return
                openModal$.next({
                  component: (
                    <SUWController
                      stakingToken={stakingToken}
                      mode="unstaking"
                    />
                  )
                })
              }}
              className={cx("LendNStakeAssetCard__unstake", {
                "LendNStakeAssetCard__unstake--disabled": !isUnstakingAvailable
              })}
            >
              {I18n.t('myasset.unstaking')}
            </button>
            <button 
              onClick={() => {
                if (!isStakingAvailable) return
                openModal$.next({
                  component: (
                    <SUWController
                      stakingToken={stakingToken}
                      mode="staking"
                    />
                  )
                })
              }}
              className={cx("LendNStakeAssetCard__stake", {
                "LendNStakeAssetCard__stake--disabled": !isStakingAvailable
              })}
            >
              {I18n.t('myasset.staking')}
            </button>
          </div>
          <button 
            onClick={() => {
              if (!isWithdrawAvailable) return
              openModal$.next({
                component: (
                  <SUWController
                    stakingToken={stakingToken}
                    mode="withdraw"
                  />
                )
              })
            }}
            className={cx("LendNStakeAssetCard__withdraw", {
              "LendNStakeAssetCard__withdraw--disabled": !isWithdrawAvailable
            })}
          >
            {I18n.t('myasset.withdraw')}
          </button>
        </div>
      </div>
    )
  }
}

export default LendNStakeAssetCard