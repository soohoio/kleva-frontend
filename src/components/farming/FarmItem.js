import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import LeverageController from '../LeverageController'

import './FarmItem.scss'
import { isBoostedPool, nFormatter } from '../../utils/misc'

import Bloc from './FarmItem.bloc'
import { I18n } from '../common/I18n';
import { currentLocale$ } from 'streams/i18n';
import LabelAndValue from '../LabelAndValue'
import RadioSet2 from '../common/RadioSet2'
import { isDesktop$, openContentView$, openModal$ } from '../../streams/ui'
import AddPosition from './AddPosition'
import ConnectWalletPopup from '../ConnectWalletPopup'
import AddPositionMultiToken from './AddPositionMultiToken';
import Boosted from '../Boosted'
import { lendingPoolsByStakingTokenAddress } from '../../constants/lendingpool'

class FarmItem extends Component {
  destroy$ = new Subject()
  
  bloc = new Bloc(this)

  constructor(props) {
    super(props)
  }

  componentDidMount() {
    merge(
      currentLocale$,
      this.props.borrowingAssetMap$,
      this.bloc.worker$,
      this.bloc.leverageValue$,
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

  renderFarmButton = () => {
  }

  render() {
    const {
      workerList,
      token1,
      token2,
      token3,
      token4,
      farmDeposited,
      exchange,
      lpToken,
      workerInfo,
      selectedAddress,
      borrowingAssetMap$,
    } = this.props

    // if (!this.bloc.worker$.value) return false

    const borrowingAvailableAssets = this.bloc.getBorrowingAvailableAsset()

    const borrowingAsset = borrowingAssetMap$.value[lpToken.address]

    const {
      yieldFarmingAPRWithoutLeverage,
      yieldFarmingAPR,
      tradingFeeAPR,
      tradingFeeAPRWithoutLeverage,
      debtTokenKlevaRewardsAPR,
      totalAPR,
      APY,
      leverageCapRaw,
      leverageCap,

      boostedMaximumYieldFarmingAPR,
      boostedMaximumTradingFeeAPR,
      boostedMaximumDebtTokenKlevaRewardsAPR,
      boostedMaximumBorrowingInterestAPR,
      boostedMaximumTotalAPR,
      boostedMaximumAPY,
    } = this.bloc.getRenderIngredients()

    const {
      baseBorrowingInterests,
    } = this.bloc.getBorrowingInterests()

    const radioList = Object.entries(baseBorrowingInterests)
      .filter(([address, { token, baseInterest }]) => {
        const hasLendingPool = token && lendingPoolsByStakingTokenAddress[token.address]
        return hasLendingPool || baseInterest != 0
      })
      .map(([address, { token, baseInterest }]) => {
        return {
          label: `${token.title}`,
          key: token.title,
          value: `${new BigNumber(baseInterest)
            .multipliedBy(this.bloc.leverageValue$.value - 1)
            .toFixed(2)}%`,
          onClick: () => {
            console.log('hi')
            this.bloc.setBorrowingAsset({ asset: token })
          }, // define onClick in separate items
        }
      })

    const workerConfig = this.bloc.getWorkerConfig()

    return (
      <div className="FarmItem">

        <div className="FarmItem__pairItem">
          <div className="FarmItem__tokenImages">
            <img className="FarmItem__tokenIcon" src={token1.iconSrc} />
            <img className="FarmItem__tokenIcon FarmItem__tokenIcon--baseToken" src={token2.iconSrc} />
            {token3 && <img className="FarmItem__tokenIcon FarmItem__tokenIcon--baseToken" src={token3.iconSrc} />}
            {token4 && <img className="FarmItem__tokenIcon FarmItem__tokenIcon--baseToken" src={token4.iconSrc} />}
          </div>
          <div className="FarmItem__mainInfo">
            <p className="FarmItem__title">{lpToken.title}</p>
            {/* <p className="FarmItem__title">{token1.title}+{token2.title}</p> */}
            <p className="FarmItem__exchange">{exchange}</p>
            <Boosted workerConfig={workerConfig} />
          </div>
        </div>
        <div className="FarmItem__aprItem">
          <p className="FarmItem__apy">{nFormatter(APY, 2)}%</p>
          <p className="FarmItem__apr">{nFormatter(totalAPR, 2)}%</p>
          {isBoostedPool(workerConfig) && (
            <p className="FarmItem__boostedApr">
              <span 
                className="FarmItem__boostedAprTitle"
              >
                {I18n.t('boostedMaximumaAPR.2')}
              </span>
              <span
                className="FarmItem__boostedAprValue"
              >
                {nFormatter(boostedMaximumAPY, 2)}%
              </span>
            </p>
          )}
        </div>
        <div className="FarmItem__aprDetailItem">
          {yieldFarmingAPR != 0 && <LabelAndValue label={I18n.t('farming.yieldFarmingAPR')} value={`${nFormatter(yieldFarmingAPR, 2)}%`} />}
          {tradingFeeAPR != 0 && <LabelAndValue label={I18n.t('farming.tradingFeeAPR')} value={`${nFormatter(tradingFeeAPR, 2)}%`} />}
          <LabelAndValue label={I18n.t('farming.klevaReward')} value={`${nFormatter(debtTokenKlevaRewardsAPR, 2)}%`} />
        </div>
        <div className="FarmItem__borrowingInterestItem">
          <RadioSet2
            selectedKey={borrowingAssetMap$?.value[lpToken.address]?.title}
            selectedLabel={borrowingAssetMap$?.value[lpToken.address]?.title}
            list={radioList}
          />
        </div>
        <div className="FarmItem__tvlItem">
          ${farmDeposited && nFormatter(farmDeposited.deposited, 0, currentLocale$.value, true)}
        </div>
        <div className="FarmItem__leverageItem">
          <LeverageController
            className="FarmItem__leverageController"
            offset={0.5}
            currentLeverage={this.bloc.leverageValue$.value}
            leverageLabel={I18n.t('farming.multiplyLabel')}
            leverageCap={leverageCap}
            setLeverage={(v) => this.bloc.setLeverageValue(v, leverageCapRaw)}
          />
          <button
            className={cx("FarmItem__button", {
              // "FarmItem__button--disabled": !selectedAddress,
            })}
            onClick={() => {

              if (!selectedAddress) {
                openModal$.next({
                  classNameAttach: "Modal--mobileCoverAll",
                  component: <ConnectWalletPopup />
                })
                return
              }

              openContentView$.next({
                key: "AddPosition",
                component: exchange === "kokonutswap" 
                  ? (
                    <AddPositionMultiToken
                      title={lpToken.title}
                      defaultBorrowingAsset={borrowingAsset}
                      defaultLeverage={this.bloc.leverageValue$.value}
                      yieldFarmingAPR={yieldFarmingAPRWithoutLeverage}
                      tradingFeeAPR={tradingFeeAPRWithoutLeverage}
                      workerList={workerList}
                      workerInfo={workerInfo}

                      token1={token1}
                      token2={token2}
                      token3={token3}
                      token4={token4}

                      lpToken={lpToken}
                      borrowingAvailableAssets={borrowingAvailableAssets}

                      offset={0.5}

                      baseBorrowingInterests={baseBorrowingInterests}
                    />
                  )
                  : (
                    <AddPosition
                      title={lpToken.title}
                      defaultBorrowingAsset={borrowingAsset}
                      defaultLeverage={this.bloc.leverageValue$.value}
                      yieldFarmingAPR={yieldFarmingAPRWithoutLeverage}
                      tradingFeeAPR={tradingFeeAPRWithoutLeverage}
                      workerList={workerList}
                      workerInfo={workerInfo}

                      token1={token1}
                      token2={token2}
                      token3={token3}
                      token4={token4}

                      lpToken={lpToken}
                      borrowingAvailableAssets={borrowingAvailableAssets}

                      offset={0.5}

                      baseBorrowingInterests={baseBorrowingInterests}
                    />
                  )
              })
            }}
          >
            {I18n.t('farm')}
          </button>
        </div>
      </div>
    )
  }
}

export default FarmItem