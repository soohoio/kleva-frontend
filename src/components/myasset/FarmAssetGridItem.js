import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import BigNumber from 'bignumber.js'

import { I18n } from 'components/common/I18n'

import { openContentView$, openModal$ } from '../../streams/ui'
// import ClosePositionPopup from 'components/ClosePositionPopup'
import { debtTokens, getIbTokenFromOriginalToken, lpTokenByIngredients, tokenList } from '../../constants/tokens'
import AdjustPosition from 'components/farming/AdjustPosition'

import './FarmAssetGridItem.scss'
import { nFormatter, noRounding } from '../../utils/misc'
import LabelAndValue from 'components/LabelAndValue'
import { calcKlevaRewardsAPR, getBufferedLeverage, toAPY, toFixed } from '../../utils/calc'
import QuestionMark from '../common/QuestionMark'
import ClosePosition from '../farming/ClosePosition'
import AdjustPositionMultiToken from '../farming/AdjustPositionMultiToken';
import ClosePositionMultiToken from '../farming/ClosePositionMultiToken'

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
      .toNumber()

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

      equityFarmingAmount,
      equityBaseAmount,

      selectedAddress,
      lpToken,
      lpShare,
      totalShare,
      totalStakedLpBalance,

      token1,
      token2,
      token3,
      token4,
      tokens,

      token1Amt,
      token2Amt,
      token3Amt,
      token4Amt,

      health,
    } = this.props

    const debtValueParsed = new BigNumber(debtValue)
      .div(10 ** baseToken.decimals)
      .toNumber()

    const debtRatio = new BigNumber(debtValue || 0)
      .div(positionValue || 1)
      .multipliedBy(100)
      .toNumber()

    const equityValueParsed = new BigNumber(positionValue)
      .minus(debtValue)
      .div(10 ** baseToken.decimals)
      .toNumber()
      .toLocaleString('en-us', { maximumFractionDigits: 6 })

    const liquidationThreshold = debtValue == 0
      ? 0
      : Number(killFactorBps / 100)

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
    // const yieldFarmingAPR = aprInfo && new BigNumber(aprInfo.miningAPR || 0)
    //   .plus(aprInfo.airdropAPR || 0)
    //   .toNumber()

    // APR Before
    const before_yieldFarmingAPR = aprInfo && new BigNumber(aprInfo.miningAPR || 0)
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

    // (workfactor bps + threshold) / 2
    const midOfWbpsAndThreshold = liquidationThreshold 
      ? ((workFactorBps / 100) + Number(liquidationThreshold)) / 2
      : 0

    return (
      <div className="FarmAssetGridItem">
        <div className="FarmAssetGridItem__asset">
          <div className="FarmAssetGridItem__iconWrapper">
            {tokens 
              ? (
                <>
                  <img className="FarmAssetGridItem__icon" src={token1.iconSrc} />
                  <img className="FarmAssetGridItem__icon" src={token2.iconSrc} />
                  {token3 && <img className="FarmAssetGridItem__icon" src={token3.iconSrc} />}
                  {token4 && <img className="FarmAssetGridItem__icon" src={token4.iconSrc} />}
                </>
              )
              : (
                <>
                  <img className="FarmAssetGridItem__icon" src={farmingToken.iconSrc} />
                  <img className="FarmAssetGridItem__icon" src={baseToken.iconSrc} />
                </>
              )
            }
          </div>
          <div className="FarmAssetGridItem__titleWrapper">
            <p className="FarmAssetGridItem__poolInfoTitle">{lpToken.title}</p>
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
            value={I18n.t('myasset.farming.leverageValue', { leverage: Number(currentPositionLeverage).toFixed(1) })}
          />
        </div>
        <div className="FarmAssetGridItem__values">
          <p className="FarmAssetGridItem__marketValue">${nFormatter(balanceTotalInUSD, 2)}</p>
          {tokens 
            ? (
              <>
                <p className="FarmAssetGridItem__assetValue">{noRounding(token1Amt, 4)} {token1.title}</p>
                <p className="FarmAssetGridItem__assetValue">{noRounding(token2Amt, 4)} {token2.title}</p>
                {token3 && <p className="FarmAssetGridItem__assetValue">{noRounding(token3Amt, 4)} {token3.title}</p>}
                {token4 && <p className="FarmAssetGridItem__assetValue">{noRounding(token4Amt, 4)} {token4.title}</p>}
              </>
            )
            : (
              <>
                <p className="FarmAssetGridItem__assetValue">{noRounding(userFarmingTokenAmount, 4)} {farmingToken.title}</p>
                <p className="FarmAssetGridItem__assetValue">{noRounding(userBaseTokenAmount, 4)} {baseToken.title}</p>
              </>
            )
          }
        </div>
        <div className="FarmAssetGridItem__equityValue">
          {tokens 
            ? (
              <>
                <p className="FarmAssetGridItem__assetValue">{noRounding(token1Amt, 4)} {token1.title}</p>
                <p className="FarmAssetGridItem__assetValue">{noRounding(token2Amt, 4)} {token2.title}</p>
                {token3 && <p className="FarmAssetGridItem__assetValue">{noRounding(token3Amt, 4)} {token3.title}</p>}
                {token4 && <p className="FarmAssetGridItem__assetValue">{noRounding(token4Amt, 4)} {token4.title}</p>}
              </>
            )
            : (
              <>
                <p className="FarmAssetGridItem__assetValue">{nFormatter(equityFarmingAmount)} {farmingToken.title}</p>
                <p className="FarmAssetGridItem__assetValue">{nFormatter(equityBaseAmount)} {baseToken.title}</p>
              </>
            )
          }
        </div>
        <div className="FarmAssetGridItem__debt">
          <p>
            <span className="FarmAssetGridItem__debtValue">{nFormatter(debtValueParsed, 4)} {baseToken.title}</span>
            <span 
              className={cx("FarmAssetGridItem__debtRatio", {
                "FarmAssetGridItem__debtRatio--red": debtRatio !== 0 && debtRatio >= midOfWbpsAndThreshold,
              })}
            >
              {debtRatio.toFixed(2)}%
            </span>
          </p>
          <div className="FarmAssetGridItem__gaugeBar">
            <div
              style={{ width: `${debtRatio * 100 / Number(liquidationThreshold)}%` }}
              className={cx("FarmAssetGridItem__gauge", {
                "FarmAssetGridItem__gauge--red": debtRatio !== 0 && debtRatio >= midOfWbpsAndThreshold,
              })}
            />
            {!!liquidationThreshold && (
              <div style={{ left: `calc(100% - 14px)` }} className="FarmAssetGridItem__threshold">
                <img src="/static/images/exported/warn-mark.svg?date=20220929" />
                <p>{Number(liquidationThreshold).toFixed(1)}%</p>
              </div>
            )}
          </div>
        </div>
        <div className="FarmAssetGridItem__buttons">
          <button
            className={cx("FarmAssetGridItem__closeButton", {
              "FarmAssetGridItem__closeButton--disabled": closePositionDisabled,
            })}
            onClick={() => {
              if (closePositionDisabled) return

              openContentView$.next({
                key: "ClosePosition",
                component: exchange === "kokonutswap"
                  ? (
                    <ClosePositionMultiToken
                      id={id}
                      lpToken={lpToken}
                      token1={token1}
                      token2={token2}
                      token3={token3}
                      token4={token4}
                      tokens={tokens}
                      positionId={positionId}
                      vaultAddress={vaultAddress}
                      farmingToken={farmingToken}
                      baseToken={baseToken}
                      workerInfo={workerInfo}
                      leverageCap={leverageCap}
                      lpShare={lpShare}
                      totalShare={totalShare}
                      totalStakedLpBalance={totalStakedLpBalance}

                      token1Amt={token1Amt}
                      token2Amt={token2Amt}
                      token3Amt={token3Amt}
                      token4Amt={token4Amt}

                      positionValue={positionValue}
                      equityValue={new BigNumber(positionValue).minus(debtValue).toString()}
                      health={health}
                      debtValue={debtValue}

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
                  : (
                    <ClosePosition
                      id={id}
                      lpToken={lpToken}
                      token1={token1}
                      token2={token2}
                      token3={token3}
                      token4={token4}
                      tokens={tokens}
                      positionId={positionId}
                      vaultAddress={vaultAddress}
                      farmingToken={farmingToken}
                      baseToken={baseToken}
                      workerInfo={workerInfo}
                      leverageCap={leverageCap}
                      lpShare={lpShare}
                      totalShare={totalShare}
                      totalStakedLpBalance={totalStakedLpBalance}

                      token1Amt={token1Amt}
                      token2Amt={token2Amt}
                      token3Amt={token3Amt}
                      token4Amt={token4Amt}

                      positionValue={positionValue}
                      equityValue={new BigNumber(positionValue).minus(debtValue).toString()}
                      health={health}
                      debtValue={debtValue}

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
            {I18n.t('myasset.withdraw')}
          </button>
          <button
            className="FarmAssetGridItem__adjustButton"
            onClick={() => {

              openContentView$.next({
                key: "AdjustPosition",
                component: exchange === "kokonutswap"
                  ? (
                    <AdjustPositionMultiToken
                      id={id}
                      token1={token1}
                      token2={token2}
                      token3={token3}
                      token4={token4}
                      tokens={tokens}

                      token1Amt={token1Amt}
                      token2Amt={token2Amt}
                      token3Amt={token3Amt}
                      token4Amt={token4Amt}

                      positionValue={positionValue}
                      equityValue={new BigNumber(positionValue).minus(debtValue).toString()}
                      health={health}
                      debtValue={debtValue}

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
                  : (
                    <AdjustPosition
                      id={id}
                      token1={token1}
                      token2={token2}
                      token3={token3}
                      token4={token4}
                      tokens={tokens}
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