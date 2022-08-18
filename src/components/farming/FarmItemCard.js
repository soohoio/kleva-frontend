import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import { openModal$ } from 'streams/ui'

import LeverageController from '../LeverageController'
import AddPositionPopup from '../AddPositionPopup'

import './FarmItemCard.scss'
import BorrowingAssetSelector from '../BorrowingAssetSelector'
import { nFormatter } from '../../utils/misc'

import Bloc from './FarmItem.bloc'
import { I18n } from '../common/I18n';
import { currentLocale$ } from 'streams/i18n';
import QuestionMark from '../common/QuestionMark';
import FarmAPRDetailInfo from '../modals/FarmAPRDetailInfo'
import { openContentView$ } from '../../streams/ui'
import AddPosition from './AddPosition'

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

class FarmItemCard extends Component {

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

    return (
      <div className="FarmItemCard">
        <div className="FarmItemCard__header">
          <div className="FarmItemCard__headerLeft">
            <div className="FarmItemCard__tokenImages">
              <img className="FarmItemCard__tokenIcon" src={token1.iconSrc} />
              <img className="FarmItemCard__tokenIcon FarmItemCard__tokenIcon--baseToken" src={token2.iconSrc} />
            </div>
            <div className="FarmItemCard__mainInfo">
              <p className="FarmItemCard__title">{token1.title}+{token2.title}</p>
              <p className="FarmItemCard__exchange">{exchange}</p>
            </div>
          </div>
          <div className="FarmItemCard__subInfo">
            <p className="FarmItemCard__apy">
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
            <p className="FarmItemCard__tvl">{I18n.t('tvl')} ${farmDeposited && nFormatter(farmDeposited.deposited, 0, currentLocale$.value)}</p>
          </div>
        </div>
        <div className="FarmItemCard__footer">
          <LeverageController
            className="FarmItemCard__leverageController"
            offset={0.5}
            currentLeverage={leverageValue}
            leverageLabel={I18n.t('farming.multiplyLabel')}
            leverageCap={leverageCap}
            setLeverage={(v) => this.bloc.setLeverageValue(v, leverageCapRaw)}
          />
          <button
            className={cx("FarmItemCard__button", {
              "FarmItemCard__button--disabled": !selectedAddress,
            })}
            onClick={() => {

              if (!selectedAddress) return

              // openModal$.next({
              //   component: (
              //     <AddPositionPopup
              //       title="Add Position"
              //       defaultLeverage={leverageValue}
              //       yieldFarmingAPR={yieldFarmingAPRWithoutLeverage}
              //       tradingFeeAPR={tradingFeeAPR}

              //       workerList={workerList}
              //       workerInfo={workerInfo}

              //       token1={token1}
              //       token2={token2}

              //       lpToken={lpToken}
              //       borrowingAvailableAssets={borrowingAvailableAssets}
              //       leverage={1}
              //     />)
              // })

              openContentView$.next({
                component: (
                  <AddPosition
                    title={`${token1?.title}+${token2?.title}`}
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

export default FarmItemCard