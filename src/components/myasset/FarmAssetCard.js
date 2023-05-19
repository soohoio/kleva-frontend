import React, { Component, Fragment, createRef } from 'react'
import { join } from 'tailwind-merge'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import BigNumber from 'bignumber.js'

import { I18n } from 'components/common/I18n'

import { openContentView$, openModal$ } from '../../streams/ui'
// import ClosePositionPopup from 'components/ClosePositionPopup'
import { debtTokens, getIbTokenFromOriginalToken, lpTokenByIngredients, tokenList } from '../../constants/tokens'
// import AdjustPositionPopup from 'components/AdjustPositionPopup'

import './FarmAssetCard.scss'
import { isSameAddress, nFormatter, noRounding } from '../../utils/misc'
import LabelAndValue from 'components/LabelAndValue'
import { calcKlevaRewardsAPR, getBufferedLeverage, toAPY } from '../../utils/calc'
import QuestionMark from '../common/QuestionMark'
import AdjustPosition from '../farming/AdjustPosition'
import ClosePosition from '../farming/ClosePosition'
import TotalAssetInfoModal from '../modals/TotalAssetInfoModal'
import FarmAPRDetailInfo2 from '../modals/FarmAPRDetailInfo2'
import AdjustPositionMultiToken from '../farming/AdjustPositionMultiToken';
import ClosePositionMultiToken from '../farming/ClosePositionMultiToken'

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

  renderEquityTokenAmounts = () => {

    const {
      baseToken,
      token1,
      token2,
      token3,
      token4,
      debtValue,
      token1Amt,
      token2Amt,
      token3Amt,
      token4Amt,
    } = this.props

    const debtValueParsed = new BigNumber(debtValue)
      .div(10 ** baseToken.decimals)
      .toNumber()

    const tokens = [
      { address: token1.address, title: token1.title, amount: token1Amt },
      { address: token2.address, title: token2.title, amount: token2Amt },
      token3 && { address: token3.address, title: token3.title, amount: token3Amt },
      token4 && { address: token4.address, title: token4.title, amount: token4Amt },
    ]
      .filter(Boolean)
      .map((token) => {
        const { address, title, amount } = token
        return {
          title,
          amount: isSameAddress(address, baseToken.address)
            ? new BigNumber(amount).minus(debtValueParsed).toString()
            : amount
        }
      })

    return tokens.map(({ title, amount }) => (
      <p>
        {noRounding(amount, 4)} {title}
      </p>
    ))
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

      equityFarmingAmount,
      equityBaseAmount,

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
      : (workerInfo && workerInfo.isMembershipUser)
        ? Number(workerInfo.membershipKillFactorBps / 100)
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
      <div className="FarmAssetCard">
        <div className="FarmAssetCard__iconWrapper">
          {tokens
            ? (
              <>
                <img className="FarmAssetCard__icon" src={token1.iconSrc} />
                <img className="FarmAssetCard__icon" src={token2.iconSrc} />
                {token3 && <img className="FarmAssetCard__icon" src={token3.iconSrc} />}
                {token4 && <img className="FarmAssetCard__icon" src={token4.iconSrc} />}
              </>
            )
            : (
              <>
                <img className="FarmAssetCard__icon" src={farmingToken.iconSrc} />
                <img className="FarmAssetCard__icon" src={baseToken.iconSrc} />
              </>
            )
          }
        </div>
        <div className="FarmAssetCard__content">
          <LabelAndValue
            className="LendNStakeAssetCard__contentHeader"
            label={(
              <>
                <p className="FarmAssetCard__poolInfoTitle">{lpToken.title}</p>
                <p className="FarmAssetCard__poolInfoExchange">{exchange} #{positionId}</p>
              </>
            )}
            value={(
              <>
                <>
                  <p className="FarmAssetCard__apy">
                      {workerInfo.isMembershipUser 
                        ? (
                          <div className="flex items-center">
                            <img
                              className="w-[13px] h-[17px] mr-[2px]"
                              src="/static/images/exported/lightning.svg"
                            />
                            <span
                              className={join(
                                "font-[700] leading-[19px] text-[18px]",
                                "FarmAssetCard__boostedAprTitle"
                              )}
                            >
                              {nFormatter(before_apy, 2)}%
                            </span>
                          </div>
                        )
                        : `${nFormatter(before_apy, 2)}%`
                      }
                      
                      <QuestionMark 
                        info
                        onClick={() => {

                          openModal$.next({
                            component: (
                              <FarmAPRDetailInfo2
                                title={`${lpToken.title}`}
                                yieldFarmingAPR={before_yieldFarmingAPR}
                                klevaRewardAPR={before_klevaRewardsAPR}
                                tradingFeeAPR={before_tradingFeeAPR}
                                borrowingInterest={before_borrowingInterestAPR}
                                apr={before_apr}
                                apy={before_apy}
                              />
                            )
                          })
                        }}
                      />
                    </p>
                  <p className="FarmAssetCard__leverage">{I18n.t('myasset.farming.leverageValue', { leverage: Number(currentPositionLeverage).toFixed(1) })}</p>
                </>
              </>
            )}
          />
          <LabelAndValue
            className="FarmAssetCard__valueItem FarmAssetCard__valueItem--total"
            label={(
              <QuestionMark 
                title={I18n.t('myasset.farming.totalValue')}
                onClick={() => {
                  openModal$.next({
                    component: <TotalAssetInfoModal />
                  })
                }}
              />
            )}
            value={(
              <>
                <p className="FarmAssetCard__balanceInUSD">${nFormatter(balanceTotalInUSD, 2)}</p>

                {tokens
                  ? (
                    <>
                      <p>{noRounding(token1Amt, 4)} {token1.title}</p>
                      <p>{noRounding(token2Amt, 4)} {token2.title}</p>
                      {token3 && <p>{noRounding(token3Amt, 4)} {token3.title}</p>}
                      {token4 && <p>{noRounding(token4Amt, 4)} {token4.title}</p>}
                    </>
                  )
                  : (
                    <>
                      <p>{noRounding(userFarmingTokenAmount, 4)} {farmingToken.title}</p>
                      <p>{noRounding(userBaseTokenAmount, 4)} {baseToken.title}</p>
                    </>
                  )
                }
              </>
            )}
          />
          <LabelAndValue
            className="FarmAssetCard__valueItem"
            label={I18n.t('myasset.farming.equityValue')}
            value={tokens 
                ? this.renderEquityTokenAmounts()
                : (
                  <>
                    <p>{nFormatter(equityFarmingAmount)} {farmingToken.title}</p>
                    <p>{nFormatter(equityBaseAmount)} {baseToken.title}</p>
                  </>
              )
            }
          />
          <LabelAndValue
            className="FarmAssetCard__valueItem FarmAssetCard__valueItem--debt"
            label={I18n.t('myasset.farming.debtValue')}
            value={`${nFormatter(debtValueParsed, 2)} ${baseToken.title}`}
          />
          <LabelAndValue
            className={cx("FarmAssetCard__debtRatio", {
              "FarmAssetCard__debtRatio--red": debtRatio !== 0 && debtRatio >= midOfWbpsAndThreshold,
            })}
            label={(
              <>
                <p>{I18n.t('myasset.farming.debtRatio')}</p>
                <p className="FarmAssetCard__miscLabel">{I18n.t('myasset.farming.debtRatio.label')}</p>
              </>
            )}
            value={`${debtRatio.toFixed(2)}%`}
          />
          <div className="FarmAssetCard__gaugeBar">
            <div 
              style={{ width: `${debtRatio * 100 / Number(liquidationThreshold)}%` }} 
              className={cx("FarmAssetCard__gauge", {
                "FarmAssetCard__gauge--red": debtRatio !== 0 && debtRatio >= midOfWbpsAndThreshold,
              })}
            />
            {!!liquidationThreshold && <img src="/static/images/exported/warn-mark.svg?date=20220929" className="FarmAssetCard__warnMark" />}
          </div>
          {!!liquidationThreshold && <p className="FarmAssetCard__debtRatioDescription">{I18n.t('myasset.farming.debtRatio.description', { value: Number(liquidationThreshold).toFixed(1) })}</p>}
          <div className="FarmAssetCard__buttons">
            <button
              className={cx("FarmAssetCard__closeButton", {
                "FarmAssetCard__closeButton--disabled": closePositionDisabled,
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

                        token1Amt={token1Amt}
                        token2Amt={token2Amt}
                        token3Amt={token3Amt}
                        token4Amt={token4Amt}

                        positionValue={positionValue}
                        equityValue={new BigNumber(positionValue).minus(debtValue).toString()}
                        health={health}
                        debtValue={debtValue}

                        positionId={positionId}
                        vaultAddress={vaultAddress}
                        farmingToken={farmingToken}
                        baseToken={baseToken}
                        workerInfo={workerInfo}
                        leverageCap={leverageCap}
                        lpShare={lpShare}
                        totalShare={totalShare}
                        totalStakedLpBalance={totalStakedLpBalance}

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

                        token1Amt={token1Amt}
                        token2Amt={token2Amt}
                        token3Amt={token3Amt}
                        token4Amt={token4Amt}

                        positionValue={positionValue}
                        equityValue={new BigNumber(positionValue).minus(debtValue).toString()}
                        health={health}
                        debtValue={debtValue}

                        positionId={positionId}
                        vaultAddress={vaultAddress}
                        farmingToken={farmingToken}
                        baseToken={baseToken}
                        workerInfo={workerInfo}
                        leverageCap={leverageCap}
                        lpShare={lpShare}
                        totalShare={totalShare}
                        totalStakedLpBalance={totalStakedLpBalance}

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
              className="FarmAssetCard__adjustButton"
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
      </div>
    )
  }
}

export default FarmAssetCard