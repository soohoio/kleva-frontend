import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import BigNumber from 'bignumber.js'

import { I18n } from 'components/common/I18n'

import { openContentView$, openModal$ } from '../../streams/ui'
import ClosePositionPopup from 'components/ClosePositionPopup'
import { debtTokens, getIbTokenFromOriginalToken, lpTokenByIngredients, tokenList } from '../../constants/tokens'
import AdjustPosition from 'components/farming/AdjustPosition'

import './FarmAssetGridItem.scss'
import { nFormatter, noRounding } from '../../utils/misc'
import LabelAndValue from 'components/LabelAndValue'
import { calcKlevaRewardsAPR, getBufferedLeverage, toAPY, toFixed } from '../../utils/calc'
import QuestionMark from '../common/QuestionMark'

class FarmAssetGridItem extends Component {
  destroy$ = new Subject()

  componentDidMount() {

  }

  componentWillUnmount() {
    this.destroy$.next(true)
  }

  getCurrentLeverageValue = () => {
    const { baseToken, positionValue, debtValue } = this.props
    const equityValueParsed = new BigNumber(positionValue)
      .minus(debtValue)
      .div(10 ** baseToken.decimals)
      .toNumber()
    // .toLocaleString('en-us', { maximumFractionDigits: 6 })

    const debtValueParsed = new BigNumber(debtValue)
      .div(10 ** baseToken.decimals)
      .toNumber()
    // .toLocaleString('en-us', { maximumFractionDigits: 6 })

    const currentPositionLeverage = new BigNumber(equityValueParsed)
      .plus(debtValueParsed)
      .div(equityValueParsed)

    return currentPositionLeverage
  }

  getDebtTokenKlevaRewardsAPR = (leverageValue) => {
    const { baseToken, klevaAnnualRewards, tokenPrices, lendingTokenSupplyInfo } = this.props

    return calcKlevaRewardsAPR({
      tokenPrices,
      lendingTokenSupplyInfo,
      borrowingAsset: baseToken,
      debtTokens,
      klevaAnnualRewards,
      klevaTokenPrice: tokenPrices[tokenList.KLEVA.address.toLowerCase()],
      leverage: leverageValue,
    })
  }

  getBorrowingInterestAPR = () => {
    const { lendingTokenSupplyInfo, baseToken } = this.props

    const borrowingInterest = lendingTokenSupplyInfo &&
      lendingTokenSupplyInfo[baseToken.address] &&
      lendingTokenSupplyInfo[baseToken.address].borrowingInterest

    return borrowingInterest
  }

  render() {
    const {
      balanceTotalInUSD,
      id,
      positionId,
      farmingToken,
      baseToken,
      positionValue,
      debtValue,
      exchange, // klayswap
      workFactorBps, // leverage cap
      killFactorBps, // liquidation threshold
      vaultAddress,
      aprInfo,
      workerInfo,
      tokenPrices,
      onClick,

      userFarmingTokenAmount,
      userBaseTokenAmount,

      selectedAddress,
      lpToken,
    } = this.props

    const debtValueParsed = new BigNumber(debtValue)
      .div(10 ** baseToken.decimals)
      .toNumber()

    const debtRatio = new BigNumber(debtValue || 0)
      .div(positionValue || 1)
      .multipliedBy(100)
      .toFixed(2)

    const equityValueParsed = new BigNumber(positionValue)
      .minus(debtValue)
      .div(10 ** baseToken.decimals)
      .toNumber()
      .toLocaleString('en-us', { maximumFractionDigits: 6 })

    const liquidationThreshold = debtValue == 0
      ? 0
      : Number(killFactorBps / 100)
        .toLocaleString('en-us', { maximumFractionDigits: 2 })

    const safetyBuffer = debtValue == 0
      ? 0
      : new BigNumber(liquidationThreshold)
        .minus(debtRatio)
        .toNumber()

    const closePositionDisabled = safetyBuffer < 0
    // closePosition always enabled
    // const closePositionDisabled = false

    const leverageCap = getBufferedLeverage(workFactorBps)

    // APR
    const currentPositionLeverage = this.getCurrentLeverageValue()
    // const yieldFarmingAPR = aprInfo && new BigNumber(aprInfo.kspMiningAPR || 0)
    //   .plus(aprInfo.airdropAPR || 0)
    //   .toNumber()

    // APR Before
    const before_yieldFarmingAPR = aprInfo && new BigNumber(aprInfo.kspMiningAPR || 0)
      .plus(aprInfo.airdropAPR || 0)
      .multipliedBy(currentPositionLeverage)
      .toNumber()

    const before_tradingFeeAPR = aprInfo && new BigNumber(aprInfo.tradingFeeAPR || 0)
      .multipliedBy(currentPositionLeverage)
      .toNumber()

    const before_klevaRewardsAPR = this.getDebtTokenKlevaRewardsAPR(currentPositionLeverage)

    const before_borrowingInterestAPR = new BigNumber(this.getBorrowingInterestAPR())
      .multipliedBy(currentPositionLeverage - 1)
      .toNumber()

    const before_apr = new BigNumber(before_yieldFarmingAPR)
      .plus(before_tradingFeeAPR)
      .plus(before_klevaRewardsAPR)
      .minus(before_borrowingInterestAPR)
      .toNumber()

    const before_apy = toAPY(before_apr)

    return (
      <div className="FarmAssetGridItem">
        <div className="FarmAssetGridItem__asset">
          <div className="FarmAssetGridItem__iconWrapper">
            <img className="FarmAssetGridItem__icon" src={farmingToken.iconSrc} />
            <img className="FarmAssetGridItem__icon" src={baseToken.iconSrc} />
          </div>
          <div className="FarmAssetGridItem__titleWrapper">
            <p className="FarmAssetGridItem__poolInfoTitle">{farmingToken.title}+{baseToken.title}</p>
            <p className="FarmAssetGridItem__poolInfoExchange">{exchange} #{positionId}</p>
          </div>
        </div>
        <div className="FarmAssetGridItem__aprapy">
          <LabelAndValue
            className="FarmAssetGridItem__apy"
            label=""
            value={`${nFormatter(before_apy, 2)}%`}
          />
          <LabelAndValue
            className="FarmAssetGridItem__apr"
            label=""
            value={I18n.t('myasset.farming.leverageValue', { leverage: toFixed(Number(currentPositionLeverage), 1) })}
          />
        </div>
        <div className="FarmAssetGridItem__values">
          <p className="FarmAssetGridItem__marketValue">${nFormatter(balanceTotalInUSD, 2)}</p>
          <p className="FarmAssetGridItem__assetValue">{noRounding(userFarmingTokenAmount, 4)} {farmingToken.title}</p>
          <p className="FarmAssetGridItem__assetValue">{noRounding(userBaseTokenAmount, 4)} {baseToken.title}</p>
        </div>
        <div className="FarmAssetGridItem__equityValue">
          <p className="FarmAssetGridItem__assetValue">{noRounding(equityValueParsed, 4)} {baseToken.title}</p>
        </div>
        <div className="FarmAssetGridItem__debt">
          <p>
            <span className="FarmAssetGridItem__debtValue">{nFormatter(debtValueParsed, 4)} {baseToken.title}</span>
            <span 
              className={cx("FarmAssetGridItem__debtRatio", {
                "FarmAssetGridItem__debtRatio--yellow": debtRatio !== 0 && debtRatio > 40 && debtRatio < 70,
                "FarmAssetGridItem__debtRatio--red": debtRatio !== 0 && debtRatio > 70,
              })}
            >
              {debtRatio}%
            </span>
          </p>
          <div className="FarmAssetGridItem__gaugeBar">
            <div
              style={{ width: `${debtRatio}%` }}
              className={cx("FarmAssetGridItem__gauge", {
                "FarmAssetGridItem__gauge--yellow": debtRatio !== 0 && debtRatio > 40 && debtRatio < 70,
                "FarmAssetGridItem__gauge--red": debtRatio !== 0 && debtRatio > 70,
              })}
            />
          </div>
        </div>
        <div className="FarmAssetGridItem__buttons">
          <button
            className={cx("FarmAssetGridItem__closeButton", {
              "FarmAssetGridItem__closeButton--disabled": closePositionDisabled,
            })}
            onClick={() => {
              if (closePositionDisabled) return

              openModal$.next({
                component: (
                  <ClosePositionPopup
                    title="Close Position"
                    id={id}
                    tokenPrices={tokenPrices}
                    positionId={positionId}
                    vaultAddress={vaultAddress}
                    farmingToken={farmingToken}
                    baseToken={baseToken}
                    workerInfo={workerInfo}

                    yieldFarmingAPRBefore={before_yieldFarmingAPR}
                    tradingFeeAPRBefore={before_tradingFeeAPR}
                    klevaRewardsAPRBefore={before_klevaRewardsAPR}
                    borrowingInterestAPRBefore={before_borrowingInterestAPR}
                  />
                )
              })
            }}
          >
            {I18n.t('myasset.withdraw')}
          </button>
          <button
            className="FarmAssetGridItem__adjustButton"
            onClick={() => {

              openContentView$.next({
                component: (
                  <AdjustPosition
                    id={id}
                    lpToken={lpToken}
                    positionId={positionId}
                    vaultAddress={vaultAddress}
                    farmingToken={farmingToken}
                    baseToken={baseToken}
                    workerInfo={workerInfo}
                    leverageCap={leverageCap}

                    borrowingInterestAPRBefore={before_borrowingInterestAPR}

                    baseBorrowingInterestAPR={this.getBorrowingInterestAPR()}


                    selectedAddress={selectedAddress}
                    title={I18n.t('myasset.farming.adjustPosition')}
                    currentPositionLeverage={currentPositionLeverage}

                    yieldFarmingAPR={before_yieldFarmingAPR}
                    tradingFeeAPR={before_tradingFeeAPR}
                    klevaRewardAPR={before_klevaRewardsAPR}

                    offset={0.5}
                  />
                )
              })
            }}
          >
            {I18n.t('myasset.farming.adjustPosition')}
          </button>
        </div>
      </div>
    )
  }
}

export default FarmAssetGridItem