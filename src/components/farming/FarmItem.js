import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import { openModal$ } from 'streams/ui'

import LeverageController from '../LeverageController'
import AddPositionPopup from '../AddPositionPopup'

import './FarmItem.scss'
import BorrowingAssetSelector from '../BorrowingAssetSelector'
import { nFormatter } from '../../utils/misc'

import Bloc from './FarmItem.bloc'
import { I18n } from '../common/I18n';
import { currentLocale$ } from 'streams/i18n';
import QuestionMark from '../common/QuestionMark';
import FarmAPRDetailInfo from '../modals/FarmAPRDetailInfo'
import LabelAndValue from '../LabelAndValue'
import RadioSet2 from '../common/RadioSet2'

const FarmProperty = ({ className, label, labelSub, value }) => {
  return (
    <div className={cx("FarmProperty", className)}>
      <div className="FarmProperty__label">
        {label}
        {labelSub && <p className="FarmProperty__labelSub">{labelSub}</p>}
      </div>
      <div className="FarmProperty__value">{value}</div>
    </div>
  )
}

class FarmItem extends Component {

  bloc = new Bloc(this)

  destroy$ = new Subject()

  constructor(props) {
    super(props)
  }

  componentDidMount() {
    merge(
      currentLocale$,
      this.props.borrowingAssetMap$,
      // this.bloc.borrowingAsset$,
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
      farmDeposited,
      exchange,
      lpToken,
      workerInfo,
      selectedAddress,
      borrowingAssetMap$,
    } = this.props

    const leverageValue = this.bloc.leverageValue$.value
    const borrowingAvailableAssets = this.bloc.getBorrowingAvailableAsset()

    const {
      yieldFarmingAPRWithoutLeverage,
      yieldFarmingAPR,
      tradingFeeAPR,
      debtTokenKlevaRewardsAPR,
      totalAPR,
      APY,
      leverageCapRaw,
      leverageCap,
    } = this.bloc.getRenderIngredients()

    const {
      baseBorrowingInterests,
      selectedBorrowingAssetWithInterest,
    } = this.bloc.getBorrowingInterests()

    const radioList = Object.entries(baseBorrowingInterests).map(([address, { token, baseInterest }]) => {
      return {
        label: `${token.title}`,
        value: `-${new BigNumber(baseInterest)
          .multipliedBy(this.bloc.leverageValue$.value - 1)
          .toFixed(2)}%`,
        onClick: () => this.bloc.setBorrowingAsset({ asset: token }), // define onClick in separate items
      }
    })

    return (
      <div className="FarmItem">

        <div className="FarmItem__pairItem">
          <div className="FarmItem__tokenImages">
            <img className="FarmItem__tokenIcon" src={token1.iconSrc} />
            <img className="FarmItem__tokenIcon FarmItem__tokenIcon--baseToken" src={token2.iconSrc} />
          </div>
          <div className="FarmItem__mainInfo">
            <p className="FarmItem__title">{token1.title}+{token2.title}</p>
            <p className="FarmItem__exchange">{exchange}</p>
          </div>
        </div>
        <div className="FarmItem__aprItem">
          <p className="FarmItem__apr">{nFormatter(totalAPR, 2)}%</p>
          <p className="FarmItem__apy">{nFormatter(APY, 2)}%</p>
        </div>
        <div className="FarmItem__aprDetailItem">
          <LabelAndValue label={I18n.t('farming.yieldFarmingAPR')} value={`${nFormatter(yieldFarmingAPR, 2)}%`} />
          <LabelAndValue label={I18n.t('farming.klevaReward')} value={`${nFormatter(debtTokenKlevaRewardsAPR, 2)}%`} />
        </div>
        <div className="FarmItem__borrowingInterestItem">
          <RadioSet2
            selectedLabel={borrowingAssetMap$?.value[lpToken.address]?.title}
            list={radioList}
          />
        </div>
        <div className="FarmItem__tvlItem">
          ${farmDeposited && nFormatter(farmDeposited.deposited, 0, currentLocale$.value)}
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
              "FarmItem__button--disabled": !selectedAddress,
            })}
            onClick={() => {

              if (!selectedAddress) return

              openModal$.next({
                component: (
                  <AddPositionPopup
                    title="Add Position"
                    defaultLeverage={this.bloc.leverageValue$.value}
                    yieldFarmingAPR={yieldFarmingAPRWithoutLeverage}
                    tradingFeeAPR={tradingFeeAPR}
                    workerList={workerList}
                    workerInfo={workerInfo}

                    token1={token1}
                    token2={token2}

                    lpToken={lpToken}
                    borrowingAvailableAssets={borrowingAvailableAssets}
                    leverage={1}
                  />)
              })
            }}
          >
            {I18n.t('farm')}
          </button>
        </div>
        


        {/* <div className="FarmItem__header">
          <div className="FarmItem__headerLeft">
            <div className="FarmItem__tokenImages">
              <img className="FarmItem__tokenIcon" src={token1.iconSrc} />
              <img className="FarmItem__tokenIcon FarmItem__tokenIcon--baseToken" src={token2.iconSrc} />
            </div>
            <div className="FarmItem__mainInfo">
              <p className="FarmItem__title">{token1.title}+{token2.title}</p>
              <p className="FarmItem__exchange">{exchange}</p>
            </div>
          </div>
          <div className="FarmItem__subInfo">
            <p className="FarmItem__apy">
              {nFormatter(APY, 2)}%
              <QuestionMark
                color="#265FFC"
                info
                onClick={() => {
                  openModal$.next({
                    component: (
                      <FarmAPRDetailInfo
                        title={`${token1.title}+${token2.title}`}
                        workerInfo={workerInfo}
                        workerList={workerList}
                        lpToken={lpToken}
                        token1={token1}
                        token2={token2}
                        selectedAddress={selectedAddress}
                        yieldFarmingAPRWithoutLeverage={yieldFarmingAPRWithoutLeverage}
                        borrowingAvailableAssets={borrowingAvailableAssets}
                        borrowingAssetMap$={borrowingAssetMap$}
                        leverageValue$={this.bloc.leverageValue$}
                        leverageCapRaw={leverageCapRaw}
                        leverageCap={leverageCap}
                        worker$={this.bloc.worker$}
                        setLeverage={(v) => this.bloc.setLeverageValue(v, leverageCapRaw)}
                        setBorrowingAsset={this.bloc.setBorrowingAsset}
                        yieldFarmingAPR={yieldFarmingAPR}
                        klevaRewardAPR={debtTokenKlevaRewardsAPR}
                        tradingFeeAPR={tradingFeeAPR}
                        baseBorrowingInterests={baseBorrowingInterests}
                        apr={totalAPR}
                        apy={APY}
                      />
                    )
                  })
                }}
              />
            </p>
            <p className="FarmItem__tvl">{I18n.t('tvl')} ${farmDeposited && nFormatter(farmDeposited.deposited, 0, currentLocale$.value)}</p>
          </div>
        </div>
        <div className="FarmItem__footer">
          <LeverageController
            className="FarmItem__leverageController"
            offset={0.5}
            currentLeverage={leverageValue}
            leverageLabel={I18n.t('farming.multiplyLabel')}
            leverageCap={leverageCap}
            setLeverage={(v) => this.bloc.setLeverageValue(v, leverageCapRaw)}
          />
          <button
            className={cx("FarmItem__button", {
              "FarmItem__button--disabled": !selectedAddress,
            })}
            onClick={() => {

              if (!selectedAddress) return

              openModal$.next({
                component: (
                  <AddPositionPopup
                    title="Add Position"
                    defaultLeverage={leverageValue}
                    yieldFarmingAPR={yieldFarmingAPRWithoutLeverage}
                    tradingFeeAPR={tradingFeeAPR}

                    workerList={workerList}
                    workerInfo={workerInfo}

                    token1={token1}
                    token2={token2}

                    lpToken={lpToken}
                    borrowingAvailableAssets={borrowingAvailableAssets}
                    leverage={1}
                  />)
              })
            }}
          >
            {I18n.t('farm')}
          </button>
        </div> */}
      </div>
    )
  }
}

export default FarmItem