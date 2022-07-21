import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import "./FarmAPRDetailInfo.scss"

import Modal from '../common/Modal'
import { I18n } from '../common/I18n'
import LabelAndValue from '../LabelAndValue'
import { nFormatter } from '../../utils/misc'
import LendAndStakeControllerPopup from '../lendnstake/LendAndStakeControllerPopup'
import { openModal$ } from '../../streams/ui'
import { lendingTokenSupplyInfo$ } from '../../streams/vault'
import RadioSet from '../common/RadioSet'
import RadioSet2 from '../common/RadioSet2'
import AddPositionPopup from '../AddPositionPopup';
import LeverageController from '../LeverageController';



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

      yieldFarmingAPR,
      yieldFarmingAPRWithoutLeverage,
      klevaRewardAPR,
      tradingFeeAPR,
      apr,
      apy,
      baseBorrowingInterests,
      borrowingAvailableAssets,
      setBorrowingAsset,
      selectedAddress,
      workerInfo,
      workerList,
      
      setLeverage,
      lpToken,
      leverageCapRaw,
      leverageCap,
      borrowingAssetMap$,
      leverageValue$,
      worker$,
    } = this.props

    const radioList = Object.entries(baseBorrowingInterests).map(([address, { token, baseInterest }]) => {
      return {
        label: `${token.title}`,
        labelDecorator: I18n.t('borrow'),
        value: `-${new BigNumber(baseInterest)
          .multipliedBy(leverageValue$.value - 1)
          .toFixed(2)}%`,
        onClick: () => setBorrowingAsset({ asset: token }), // define onClick in separate items
      }
    })

    return (
      <Modal className="FarmAPRDetailInfo" title={title}>
        <LabelAndValue label={I18n.t('farming.yieldFarmingReward')} value={`${nFormatter(yieldFarmingAPR, 2)}%`} />
        <LabelAndValue label={I18n.t('farming.klevaReward')} value={`${nFormatter(klevaRewardAPR, 2)}%`} />
        {!!tradingFeeAPR && <LabelAndValue label={I18n.t('farming.tradingFeeAPR')} value={`${nFormatter(tradingFeeAPR, 2)}%`} />}
        <RadioSet2
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
            leverageCap={leverageCap}
            setLeverage={(v) => setLeverage(v)}
          />
          <button
            className={cx("FarmAPRDetailInfo__button", {
              "FarmAPRDetailInfo__button--disabled": !selectedAddress,
            })}
            onClick={() => {

              if (!selectedAddress) return

              openModal$.next({
                component: (
                  <AddPositionPopup
                    title="Add Position"
                    defaultLeverage={leverageValue$.value}
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
      </Modal>
    )
  }
}

  export default FarmAPRDetailInfo