import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import "./FarmAPRDetailInfo.scss"

import Modal from '../common/Modal'
import { I18n } from '../common/I18n'
import LabelAndValue from '../LabelAndValue'
import { nFormatter, noRounding } from '../../utils/misc'
import { closeModal$, openContentView$, openModal$ } from '../../streams/ui'
import { lendingTokenSupplyInfo$ } from '../../streams/vault'
import RadioSet2 from '../common/RadioSet2'
import LeverageController from '../LeverageController';
import AddPosition from '../farming/AddPosition'
import ConnectWalletPopup from '../ConnectWalletPopup'
import { calcKlevaRewardsAPR, toAPY } from '../../utils/calc'
import { tokenPrices$ } from '../../streams/tokenPrice'
import { klevaAnnualRewards$ } from '../../streams/farming'
import { debtTokens, tokenList } from '../../constants/tokens'
import AddPositionMultiToken from '../farming/AddPositionMultiToken';

class FarmAPRDetailInfo extends Component {

  destroy$ = new Subject()

  componentDidMount() {
    merge(
      lendingTokenSupplyInfo$,
      this.props.borrowingAssetMap$,
      this.props.leverageValue$,
    ).pipe(
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
      title,

      token1,
      token2,
      token3,
      token4,
      exchange,

      baseBorrowingInterests,
      borrowingAvailableAssets,
      setBorrowingAsset,
      selectedAddress,
      workerInfo,
      workerList,
      
      setLeverage,
      lpToken,
      borrowingAssetMap$,
      leverageValue$,
      worker$,

      yieldFarmingAPRWithoutLeverage,
      tradingFeeAPRWithoutLeverage,
    } = this.props

    const worker = worker$.value
    const workerConfig = workerInfo &&
      worker &&
      workerInfo[worker.workerAddress.toLowerCase()] || workerInfo[worker.workerAddress]

    const leverageCap = Number(noRounding(workerConfig && 10000 / (10000 - workerConfig.workFactorBps), 1))

    const radioList = Object.entries(baseBorrowingInterests)
      .filter(([address, { token, baseInterest }]) => {
        return !!token
        // return baseInterest != 0
      })
    .map(([address, { token, baseInterest }]) => {

      const pureValue = new BigNumber(baseInterest)
        .multipliedBy(leverageValue$.value - 1)
        // .multipliedBy(-1)
        .toFixed(2)

      return {
        label: `${I18n.t('borrow', { title: token.title })}`,
        key: token.title,
        value: `${pureValue}%`,
        pureValue,
        onClick: () => setBorrowingAsset({ asset: token }), // define onClick in separate items
      }
    })

    const borrowingAsset = borrowingAssetMap$?.value[lpToken.address]

    const borrowingInterest = new BigNumber(baseBorrowingInterests[borrowingAsset?.address]?.baseInterest)
      .multipliedBy(leverageValue$.value - 1)
      .toNumber()

    const yieldFarmingAPR = new BigNumber(yieldFarmingAPRWithoutLeverage).multipliedBy(leverageValue$.value).toNumber()
    const tradingFeeAPR = new BigNumber(tradingFeeAPRWithoutLeverage).multipliedBy(leverageValue$.value).toNumber()
    const klevaRewardAPR = calcKlevaRewardsAPR({
      tokenPrices: tokenPrices$.value,
      lendingTokenSupplyInfo: lendingTokenSupplyInfo$.value,
      borrowingAsset: borrowingAssetMap$?.value[lpToken.address],
      debtTokens,
      klevaAnnualRewards: klevaAnnualRewards$.value,
      klevaTokenPrice: tokenPrices$.value[tokenList.KLEVA.address.toLowerCase()],
      leverage: leverageValue$.value,
    })

    const apr = new BigNumber(yieldFarmingAPR)
      .plus(tradingFeeAPR)
      .plus(klevaRewardAPR)
      .minus(borrowingInterest)
      .toNumber()

    const apy = toAPY(apr)

    return (
      <Modal className="FarmAPRDetailInfo" title={title}>
        {!!yieldFarmingAPR && <LabelAndValue label={I18n.t('farming.yieldFarmingReward')} value={`${nFormatter(yieldFarmingAPR, 2)}%`} />}
        {!!tradingFeeAPR && <LabelAndValue label={I18n.t('farming.tradingFeeAPR')} value={`${nFormatter(tradingFeeAPR, 2)}%`} />}
        <LabelAndValue label={I18n.t('farming.klevaReward')} value={`${nFormatter(klevaRewardAPR, 2)}%`} />
        <RadioSet2
          selectedKey={borrowingAssetMap$?.value[lpToken.address]?.title}
          selectedLabel={borrowingAssetMap$?.value[lpToken.address]?.title}
          list={radioList}
        />
        <hr />
        <LabelAndValue className="FarmAPRDetailInfo__apr" label={I18n.t('apr')} value={`${nFormatter(apr, 2)}%`} />
        <LabelAndValue className="FarmAPRDetailInfo__apy" label={I18n.t('apy')} value={`${nFormatter(apy, 2)}%`} />

        <div className="FarmAPRDetailInfo__footer">
          <LeverageController
            className="FarmAPRDetailInfo__leverageController"
            offset={0.5}
            currentLeverage={leverageValue$.value}
            leverageLabel={I18n.t('farming.multiplyLabel')}
            setLeverage={(v) => setLeverage(v, leverageCap)}
          />
          <button
            className={cx("FarmAPRDetailInfo__button", {
              // "FarmAPRDetailInfo__button--disabled": !selectedAddress,
            })}
            onClick={() => {

              if (!selectedAddress) {
                openModal$.next({
                  classNameAttach: "Modal--mobileCoverAll",
                  component: <ConnectWalletPopup />
                })
                return
              }

              closeModal$.next(true)

              openContentView$.next({
                key: "AddPosition",
                component: exchange === "kokonutswap"
                  ? (
                    <AddPositionMultiToken
                      title={lpToken.title}
                      defaultBorrowingAsset={borrowingAsset}
                      defaultLeverage={leverageValue$.value}
                      yieldFarmingAPR={yieldFarmingAPRWithoutLeverage}
                      tradingFeeAPR={tradingFeeAPR}
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
                      defaultLeverage={leverageValue$.value}
                      yieldFarmingAPR={yieldFarmingAPRWithoutLeverage}
                      tradingFeeAPR={tradingFeeAPR}
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
      </Modal>
    )
  }
}

  export default FarmAPRDetailInfo