import React, { Component, Fragment, createRef } from 'react'
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
import { nFormatter, noRounding } from '../../utils/misc'
import LabelAndValue from 'components/LabelAndValue'
import { calcKlevaRewardsAPR, getBufferedLeverage, toAPY } from '../../utils/calc'
import QuestionMark from '../common/QuestionMark'
import AdjustPosition from '../farming/AdjustPosition'
import ClosePosition from '../farming/ClosePosition'
import TotalAssetInfoModal from '../modals/TotalAssetInfoModal'
import FarmAPRDetailInfo2 from '../modals/FarmAPRDetailInfo2'

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

      equityFarmingAmount,
      equityBaseAmount,
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
                  <p className="FarmAssetCard__apy">
                      {nFormatter(before_apy, 2)}%
                      <QuestionMark 
                        info
                        onClick={() => {

                          openModal$.next({
                            component: (
                              <FarmAPRDetailInfo2
                                title={`${farmingToken.title}+${baseToken.title}`}
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
                <p>{noRounding(userFarmingTokenAmount, 4)} {farmingToken.title}</p>
                <p>{noRounding(userBaseTokenAmount, 4)} {baseToken.title}</p>
              </>
            )}
          />
          <LabelAndValue
            className="FarmAssetCard__valueItem"
            label={I18n.t('myasset.farming.equityValue')}
            value={(
              <>
                {/* <p>{noRounding(userFarmingTokenAmount, 4)} {farmingToken.title}</p>
                <p>{noRounding(new BigNumber(userBaseTokenAmount).minus(debtValueParsed).toNumber(), 4)} {baseToken.title}</p> */}
                {/* <p>{equityValueParsed} {baseToken.title}</p> */}
                <p>{nFormatter(equityFarmingAmount)} {farmingToken.title}</p>
                <p>{nFormatter(equityBaseAmount)} {baseToken.title}</p>
              </>
            )}
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
                  component: (
                    <ClosePosition
                      id={id}
                      lpToken={lpToken}
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

                // openModal$.next({
                //   component: (
                //     <ClosePositionPopup
                //       title="Close Position"
                //       id={id}
                //       tokenPrices={tokenPrices}
                //       positionId={positionId}
                //       vaultAddress={vaultAddress}
                //       farmingToken={farmingToken}
                //       baseToken={baseToken}
                //       workerInfo={workerInfo}

                //       yieldFarmingAPRBefore={before_yieldFarmingAPR}
                //       tradingFeeAPRBefore={before_tradingFeeAPR}
                //       klevaRewardsAPRBefore={before_klevaRewardsAPR}
                //       borrowingInterestAPRBefore={before_borrowingInterestAPR}
                //     />
                //   )
                // })
              }}
            >
              {I18n.t('myasset.withdraw')}
            </button>
            <button
              className="FarmAssetCard__adjustButton"
              onClick={() => {

                openContentView$.next({
                  key: "AdjustPosition",
                  component: (
                    <AdjustPosition
                      id={id}
                      token1={token1}
                      token2={token2}
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