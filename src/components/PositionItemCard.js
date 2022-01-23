import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import BigNumber from 'bignumber.js'

import { openModal$ } from '../streams/ui'
import ClosePositionPopup from './ClosePositionPopup'
import { debtTokens, getIbTokenFromOriginalToken, lpTokenByIngredients, tokenList } from '../constants/tokens'
import AdjustPositionPopup from './AdjustPositionPopup'

import './PositionItemCard.scss'
import { nFormatter } from '../utils/misc'
import LabelAndValue from './LabelAndValue'
import { getBufferedLeverage, toAPY } from '../utils/calc'

class PositionItemCard extends Component {
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
      .toLocaleString('en-us', { maximumFractionDigits: 6 })

    const debtValueParsed = new BigNumber(debtValue)
      .div(10 ** baseToken.decimals)
      .toNumber()
      .toLocaleString('en-us', { maximumFractionDigits: 6 })

    const currentPositionLeverage = new BigNumber(equityValueParsed)
      .plus(debtValueParsed)
      .div(equityValueParsed)

    return currentPositionLeverage
  }

  getDebtTokenKlevaRewardsAPR = (leverageValue) => {
    const { baseToken, klevaAnnualRewards, tokenPrices, lendingTokenSupplyInfo } = this.props

    const ibToken = getIbTokenFromOriginalToken(baseToken)
    const debtToken = debtTokens[ibToken.address] || debtTokens[ibToken.address.toLowerCase()]
    const debtTokenPid = debtToken && debtToken.pid
    const klevaAnnualRewardForDebtToken = klevaAnnualRewards[debtTokenPid]

    const _tokenInfo = lendingTokenSupplyInfo && lendingTokenSupplyInfo[baseToken.address.toLowerCase()]
    const _debtTokenInfo = _tokenInfo && _tokenInfo.debtTokenInfo

    const klevaRewardsAPR = new BigNumber(klevaAnnualRewardForDebtToken)
      .multipliedBy(tokenPrices[tokenList.KLEVA.address.toLowerCase()])
      .div(_tokenInfo && _tokenInfo.debtTokenTotalSupply)
      .multipliedBy(10 ** (_debtTokenInfo && _debtTokenInfo.decimals))
      .multipliedBy(leverageValue - 1)
      .multipliedBy(100)
      .toNumber()

    return klevaRewardsAPR || 0
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
      isExpand,
      onClick,
    } = this.props

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
        .toLocaleString('en-us', { maximumFractionDigits: 2 })

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
      <div className="PositionItemCard">
        <div onClick={onClick} className="PositionItemCard__header">
          <div className="PositionItemCard__headerLeft">
            <div className="PositionItemCard__infoIconList">
              <img className="PositionItemCard__infoIcon" src={farmingToken.iconSrc} />
              <img className="PositionItemCard__infoIcon" src={baseToken.iconSrc} />
            </div>
            <div className="PositionItemCard__poolInfo">
              <p className="PositionItemCard__pollInfoTitle">{farmingToken.title}-{baseToken.title}</p>
              <p className="PositionItemCard__poolInfoExchange">{exchange} #{positionId}</p>
            </div>
          </div>
          <div className="PositionItemCard__headerRight">
            <div className="PositionItemCard__apy">
              <strong>{nFormatter(before_apy, 2)}</strong>%
            </div>
            <p className="PositionItemCard__apyLabel">Current APY</p>
          </div>
        </div>

        {isExpand && (
          <div className="PositionItemCard__expanded">
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
            <LabelAndValue label="Current APY" value={`${nFormatter(before_apy, 2)}%`} />
            <LabelAndValue label="Debt Ratio" value={`${nFormatter(debtRatio, 2)}%`} />
            <LabelAndValue
              label="Liquidation Threshold"
              value={`${liquidationThreshold || 'No Debt'} ${liquidationThreshold ? "%" : ""}`}
            />
            <LabelAndValue label="Safety Buffer" value={`${nFormatter(safetyBuffer, 2)} ${safetyBuffer ? "%" : ""}`}
            />
            
            <div className="PositionItemCard__buttons">
              <button
                className="PositionItemCard__closeButton"
                onClick={() => {
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
                className="PositionItemCard__adjustButton"
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
                    />
                  })


                }}
              >
                Adjust
              </button>
            </div>
          </div>
        )}
        <div onClick={onClick} className="PositionItemCard__opener">
          {isExpand
            ? <img className="PositionItemCard__expandIcon" src="/static/images/icon-unexpand.svg" />
            : <img className="PositionItemCard__expandIcon" src="/static/images/icon-expand.svg" />
          }
        </div>
      </div>
    )
  }
}

export default PositionItemCard