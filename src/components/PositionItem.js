import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import BigNumber from 'bignumber.js'

import { openModal$ } from '../streams/ui'
import ClosePositionPopup from './ClosePositionPopup'
import { debtTokens, getIbTokenFromOriginalToken, lpTokenByIngredients, tokenList } from '../constants/tokens'
import AdjustPositionPopup from './AdjustPositionPopup'

import './PositionItem.scss'
import { nFormatter } from '../utils/misc'
import { getBufferedLeverage, toAPY } from '../utils/calc'

class PositionItem extends Component {
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
        workerAddress,
        aprInfo,

        workerInfo,
        lendingTokenSupplyInfo,

        tokenPrices,
    } = this.props

    const lpToken = lpTokenByIngredients(farmingToken, baseToken)

    const positionValueParsed = new BigNumber(positionValue)
      .div(10 ** this.props.baseToken.decimals)
      .toNumber()
      .toLocaleString('en-us', { maximumFractionDigits: 6 })

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
      <div className="PositionItem">
        <div className="PositionItem__id">
          {baseToken.title} <br />
        #{positionId}
        </div>
        <div className="PositionItem__info">
          <div className="PositionItem__infoIconList">
            <img className="PositionItem__infoIcon" src={farmingToken.iconSrc} />
            <img className="PositionItem__infoIcon" src={baseToken.iconSrc} />
          </div>
          <div className="PositionItem__infoTitleList">
            <p className="PositionItem__infoTitle">{farmingToken.title}-{baseToken.title}</p>
            <p className="PositionItem__infoExchangeTitle">{exchange}</p>
          </div>
        </div>
        <div className="PositionItem__positionValue">
          <strong>
            {new BigNumber(positionValue)
              .div(10 ** baseToken.decimals)
              .toNumber()
              .toLocaleString('en-us', { maximumFractionDigits: 6 })
            }
          </strong>
          {baseToken.title}
        </div>
        <div className="PositionItem__debtValue">
          <strong>{new BigNumber(debtValue)
            .div(10 ** baseToken.decimals)
            .toNumber()
            .toLocaleString('en-us', { maximumFractionDigits: 6 })
          }</strong> {baseToken.title}
        </div>
        <div className="PositionItem__equityValue">
          <strong>{equityValueParsed}</strong> {baseToken.title}
        </div>
        <div className="PositionItem__apy">
          <strong>{nFormatter(before_apy, 2)}</strong>%
      </div>
        <div className="PositionItem__debtRatio">
          <strong>{debtRatio}</strong>%
      </div>
        <div className="PositionItem__liquidationThreshold">
          <strong>{liquidationThreshold || 'No Debt'}</strong>{!!liquidationThreshold && '%'}
        </div>
        <div className="PositionItem__safetyBuffer">
          <strong>{safetyBuffer || 'No Debt'}</strong>{!!safetyBuffer && '%'}
        </div>
        <div className="PositionItem__blank">
          <button onClick={() => {
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


          }} className="PositionItem__adjustButton">Adjust</button>
          <button className="PositionItem__closeButton" onClick={() => {

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
                  
                  baseBorrowingInterestAPR={this.getBorrowingInterestAPR()}
                />
              )
            })
          }}>Close</button>
        </div>
      </div>
    )
  }
}

export default PositionItem