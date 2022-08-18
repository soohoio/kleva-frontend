import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import BigNumber from 'bignumber.js'

import { I18n } from 'components/common/I18n'

import { openModal$ } from '../../streams/ui'
import ClosePositionPopup from 'components/ClosePositionPopup'
import { debtTokens, getIbTokenFromOriginalToken, lpTokenByIngredients, tokenList } from '../../constants/tokens'
import AdjustPositionPopup from 'components/AdjustPositionPopup'

import './FarmAssetCard.scss'
import { nFormatter, noRounding } from '../../utils/misc'
import LabelAndValue from 'components/LabelAndValue'
import { calcKlevaRewardsAPR, getBufferedLeverage, toAPY } from '../../utils/calc'
import QuestionMark from '../common/QuestionMark'

class FarmAssetCard extends Component {
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
      <div className="FarmAssetCard">
        <div className="FarmAssetCard__iconWrapper">
          <img className="FarmAssetCard__icon" src={farmingToken.iconSrc} />
          <img className="FarmAssetCard__icon" src={baseToken.iconSrc} />
        </div>
        <div className="FarmAssetCard__content">
          <LabelAndValue
            className="LendNStakeAssetCard__contentHeader"
            label={(
              <>
                <p className="FarmAssetCard__poolInfoTitle">{farmingToken.title}+{baseToken.title}</p>
                <p className="FarmAssetCard__poolInfoExchange">{exchange} #{positionId}</p>
              </>
            )}
            value={(
              <>
                <>
                  <p className="FarmAssetCard__apy">{nFormatter(before_apy, 2)}%</p>
                  <p className="FarmAssetCard__leverage">{I18n.t('myasset.farming.leverageValue', { leverage: Number(currentPositionLeverage).toFixed(1) })}</p>
                </>
              </>
            )}
          />
          <LabelAndValue
            className="FarmAssetCard__marketValue"
            label={I18n.t('myasset.marketValue')}
            value={`$${nFormatter(balanceTotalInUSD, 2)}`}
          />
          <LabelAndValue
            className="FarmAssetCard__valueItem"
            label={(
              <QuestionMark 
                title={I18n.t('myasset.farming.totalValue')}
              />
            )}
            value={(
              <>
                <p>{noRounding(userFarmingTokenAmount, 4)} {farmingToken.title}</p>
                <p>{noRounding(userBaseTokenAmount, 4)} {baseToken.title}</p>
              </>
            )}
          />
          <LabelAndValue
            className="FarmAssetCard__valueItem"
            label={(
              <QuestionMark 
                title={I18n.t('myasset.farming.equityValue')}
              />
            )}
            value={(
              <>
                {/* <p>{noRounding(userFarmingTokenAmount, 4)} {farmingToken.title}</p>
                <p>{noRounding(new BigNumber(userBaseTokenAmount).minus(debtValueParsed).toNumber(), 4)} {baseToken.title}</p> */}
                <p>{equityValueParsed} {baseToken.title}</p>
              </>
            )}
          />
          <LabelAndValue
            className="FarmAssetCard__valueItem"
            label={(
              <QuestionMark 
                title={I18n.t('myasset.farming.debtValue')}
              />
            )}
            value={`${nFormatter(debtValueParsed, 2)} ${baseToken.title}`}
          />
          <LabelAndValue
            className={cx("FarmAssetCard__debtRatio", {
              "FarmAssetCard__debtRatio--yellow": debtRatio !== 0 && debtRatio > 40 && debtRatio < 70,
              "FarmAssetCard__debtRatio--red": debtRatio !== 0 && debtRatio > 70,
            })}
            label={I18n.t('myasset.farming.debtRatio')}
            value={`${debtRatio}%`}
          />
          <div className="FarmAssetCard__gaugeBar">
            <div 
              style={{ width: `${debtRatio}%` }} 
              className={cx("FarmAssetCard__gauge", {
                "FarmAssetCard__gauge--yellow": debtRatio !== 0 && debtRatio > 40 && debtRatio < 70,
                "FarmAssetCard__gauge--red": debtRatio !== 0 && debtRatio > 70,
              })}
            />
          </div>
          <p className="FarmAssetCard__debtRatioDescription">{I18n.t('myasset.farming.debtRatio.description')}</p>
          <div className="FarmAssetCard__buttons">
            <button
              className={cx("FarmAssetCard__closeButton", {
                "FarmAssetCard__closeButton--disabled": closePositionDisabled,
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
              className="FarmAssetCard__adjustButton"
              onClick={() => {
                openModal$.next({
                  component: <AdjustPositionPopup
                    title="Adjust Position"
                    id={id}
                    positionId={positionId}
                    vaultAddress={vaultAddress}
                    farmingToken={farmingToken}
                    baseToken={baseToken}
                    workerInfo={workerInfo}
                    leverageCap={leverageCap}

                    yieldFarmingAPRBefore={before_yieldFarmingAPR}
                    tradingFeeAPRBefore={before_tradingFeeAPR}
                    klevaRewardsAPRBefore={before_klevaRewardsAPR}
                    borrowingInterestAPRBefore={before_borrowingInterestAPR}

                    baseBorrowingInterestAPR={this.getBorrowingInterestAPR()}
                  />
                })


              }}
            >
              {I18n.t('myasset.farming.adjustPosition')}
            </button>
          </div>
        </div>

        {/* <div onClick={onClick} className="FarmAssetCard__header">
          <div className="FarmAssetCard__headerLeft">
            <div className="FarmAssetCard__infoIconList">
              <img className="FarmAssetCard__infoIcon" src={farmingToken.iconSrc} />
              <img className="FarmAssetCard__infoIcon" src={baseToken.iconSrc} />
            </div>
            <div className="FarmAssetCard__poolInfo">
              <p className="FarmAssetCard__pollInfoTitle">{farmingToken.title}-{baseToken.title}</p>
              <p className="FarmAssetCard__poolInfoExchange">{exchange} #{positionId}</p>
            </div>
          </div>
          <div className="FarmAssetCard__headerRight">
            <div className="FarmAssetCard__apy">
              <strong>{nFormatter(before_apy, 2)}</strong>%
            </div>
            <p className="FarmAssetCard__apyLabel">Current APY</p>
          </div>
        </div>

        <div className="FarmAssetCard__expanded">
          <LabelAndValue
            label="Position Value"
            value={`${new BigNumber(positionValue)
              .div(10 ** baseToken.decimals)
              .toNumber()
              .toLocaleString('en-us', { maximumFractionDigits: 6 })} ${baseToken.title}`}
          />
          <LabelAndValue
            label="Debt Value"
            value={`${new BigNumber(debtValue)
              .div(10 ** baseToken.decimals)
              .toNumber()
              .toLocaleString('en-us', { maximumFractionDigits: 6 })} ${baseToken.title}`}
          />
          <LabelAndValue label="Equity Value" value={`${equityValueParsed} ${baseToken.title}`} />
          <LabelAndValue className="FarmAssetCard__apy" label="Current APY" value={`${nFormatter(before_apy, 2)}%`} />
          <LabelAndValue label="Debt Ratio" value={`${nFormatter(debtRatio, 2)}%`} />
          <LabelAndValue
            label="Liquidation Threshold"
            value={`${liquidationThreshold || '-'} ${liquidationThreshold ? "%" : ""}`}
          />
          <LabelAndValue
            className={cx("FarmAssetCard__safetyBuffer", {
              "FarmAssetCard__safetyBuffer--yellow": safetyBuffer !== 0 && safetyBuffer > 10 && safetyBuffer < 20,
              "FarmAssetCard__safetyBuffer--red": safetyBuffer !== 0 && safetyBuffer < 10,
            })}
            label="Safety Buffer"
            value={`${nFormatter(safetyBuffer, 2) || '-'} ${safetyBuffer ? "%" : ""}`}
          />

          <div className="FarmAssetCard__buttons">
            <button
              className={cx("FarmAssetCard__closeButton", {
                "FarmAssetCard__closeButton--disabled": closePositionDisabled,
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
              Close
              </button>
            <button
              className="FarmAssetCard__adjustButton"
              onClick={() => {
                openModal$.next({
                  component: <AdjustPositionPopup
                    title="Adjust Position"
                    id={id}
                    positionId={positionId}
                    vaultAddress={vaultAddress}
                    farmingToken={farmingToken}
                    baseToken={baseToken}
                    workerInfo={workerInfo}
                    leverageCap={leverageCap}

                    yieldFarmingAPRBefore={before_yieldFarmingAPR}
                    tradingFeeAPRBefore={before_tradingFeeAPR}
                    klevaRewardsAPRBefore={before_klevaRewardsAPR}
                    borrowingInterestAPRBefore={before_borrowingInterestAPR}

                    baseBorrowingInterestAPR={this.getBorrowingInterestAPR()}
                  />
                })


              }}
            >
              Adjust
              </button>
          </div>
        </div> */}
      </div>
    )
  }
}

export default FarmAssetCard