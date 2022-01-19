import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, interval, forkJoin } from 'rxjs'
import { switchMap, distinctUntilChanged, startWith, takeUntil, tap, map } from 'rxjs/operators'

import Modal from 'components/common/Modal'

import './ClosePositionPopup.scss'
import ConvertToBaseTokenSummary from './ConvertToBaseTokenSummary'

import Bloc from './ClosePositionPopup.bloc'
import MinimizeTradingSummary from './MinimizeTradingSummary'

import RadioSet from 'components/common/RadioSet'
import { health$ } from '../streams/contract'
import Checkbox from './common/Checkbox'
import PartialController from './PartialController'
import PartialClosePositionPopupSummary from './PartialClosePositionPopupSummary'

import { klayswapPoolInfo$, klevaAnnualRewards$, positions$ } from '../streams/farming'
import { lendingTokenSupplyInfo$ } from '../streams/vault'
import { balancesInWallet$, selectedAddress$ } from '../streams/wallet'
import { debtTokens, getIbTokenFromOriginalToken, tokenList } from '../constants/tokens'
import { getEachTokenBasedOnLPShare } from '../utils/calc'

class ClosePositionPopup extends Component {
  destroy$ = new Subject()
  
  constructor(props) {
    super(props)
    this.bloc = new Bloc(props)
  }
  
  componentDidMount() {
    merge(

      selectedAddress$,
      balancesInWallet$,
      lendingTokenSupplyInfo$,
      klevaAnnualRewards$,
      klayswapPoolInfo$,

      this.bloc.positionValue$,
      this.bloc.equityValue$,
      this.bloc.debtValue$,
      this.bloc.health$,
      this.bloc.closingMethod$,
      this.bloc.userFarmingTokenAmount$,
      this.bloc.userBaseTokenAmount$,

      this.bloc.lpToken$,
      this.bloc.entirelyClose$,

      this.bloc.newPositionValue$,
      this.bloc.newDebtValue$,
      this.bloc.liquidationThreshold$,
      this.bloc.currentPositionLeverage$,
      this.bloc.finalCalculatedLeverage$,

      this.bloc.newUserFarmingTokenAmount$,
      this.bloc.newUserBaseTokenAmount$,

      this.bloc.partialCloseRatio$.pipe(
        tap(() => {
          this.bloc.repayDebtRatio$.next(0)
        })
      ),
      this.bloc.repayDebtRatio$,
      this.bloc.partialCloseAvailable$,

      klayswapPoolInfo$,
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })

    merge(
      positions$,
      this.bloc.partialCloseRatio$,
      this.bloc.repayDebtRatio$,
    ).pipe(
      map(() => {
        const positionInfo = positions$.value && positions$.value.find(({ id }) => id == this.props.id)
        return positionInfo
      }),
      tap((positionInfo) => {
        const { farmingToken, baseToken } = this.props

        const positionValue = positionInfo && positionInfo.positionValue
        const debtValue = positionInfo && positionInfo.debtValue
        const equityValue = positionInfo && new BigNumber(positionInfo.positionValue).minus(debtValue)

        const currentPositionLeverage = new BigNumber(equityValue)
          .plus(debtValue)
          .div(equityValue)

        this.bloc.currentPositionLeverage$.next(currentPositionLeverage)

        const lpShare = positionInfo && positionInfo.lpShare
        const lpToken = positionInfo && positionInfo.lpToken

        const liquidationThreshold = positionInfo && (new BigNumber(positionInfo.killFactorBps).div(100).toNumber())
        this.bloc.liquidationThreshold$.next(liquidationThreshold)

        if (!lpToken) return
        const poolInfo = klayswapPoolInfo$.value[lpToken && lpToken.address && lpToken.address.toLowerCase()]

        const { userFarmingTokenAmount, userBaseTokenAmount } = getEachTokenBasedOnLPShare({ poolInfo, lpShare, farmingToken, baseToken })

        const positionValueParsed = new BigNumber(positionValue)
          .div(10 ** this.props.baseToken.decimals)
          .toNumber()
          .toLocaleString('en-us', { maximumFractionDigits: 6 })

        const equityValueParsed = new BigNumber(positionValue)
          .minus(debtValue)
          .div(10 ** this.props.baseToken.decimals)
          .toNumber()
          .toLocaleString('en-us', { maximumFractionDigits: 6 })

        const debtValueParsed = new BigNumber(debtValue)
          .div(10 ** this.props.baseToken.decimals)
          .toNumber()
          .toLocaleString('en-us', { maximumFractionDigits: 6 })

        this.bloc.lpToken$.next(lpToken)
        this.bloc.lpShare$.next(lpShare)

        this.bloc.positionValue$.next(positionValueParsed)
        this.bloc.equityValue$.next(equityValueParsed)
        this.bloc.debtValue$.next(debtValueParsed)
        this.bloc.userFarmingTokenAmount$.next(userFarmingTokenAmount)
        this.bloc.userBaseTokenAmount$.next(userBaseTokenAmount)

        // Partial Close check
        if (this.bloc.entirelyClose$.value) return

        const closedPositionValueAmount = new BigNumber(positionValue)
          .multipliedBy(this.bloc.partialCloseRatio$.value / 100)
          .toString()

        const newPositionValue = new BigNumber(positionValue)
          .minus(closedPositionValueAmount)
          .toString()

        const debtRepayment = new BigNumber(closedPositionValueAmount)
          .multipliedBy(this.bloc.repayDebtRatio$.value / 100)
          .toString()

        const newDebtValue = new BigNumber(debtValue)
          .minus(debtRepayment)
          .toString()

        const newEquityValue = new BigNumber(newPositionValue)
          .minus(newDebtValue)
          .toString()

        const finalCalculatedLeverage = new BigNumber(newPositionValue).div(newEquityValue).toNumber()
        this.bloc.finalCalculatedLeverage$.next(finalCalculatedLeverage)

        this.bloc.newPositionValue$.next(newPositionValue)
        this.bloc.newDebtValue$.next(newDebtValue)

        const {
          userFarmingTokenAmountPure: _fa,
          userBaseTokenAmountPure: _ba
        } = getEachTokenBasedOnLPShare({
          poolInfo,
          lpShare: 1 * 10 ** lpToken.decimals,
          farmingToken: this.props.farmingToken,
          baseToken: this.props.baseToken,
        })

        const baseTokenPriceInFarmingToken = new BigNumber(_fa).div(_ba).toNumber()
        const farmingTokenPriceInBaseToken = new BigNumber(_ba).div(_fa).toNumber()

        const newUserBaseTokenAmount = new BigNumber(newPositionValue)
          .div(2)
          .toNumber()

        const newUserFarmingTokenAmount = new BigNumber(newUserBaseTokenAmount)
          .multipliedBy(baseTokenPriceInFarmingToken)
          .toNumber()

        this.bloc.newUserBaseTokenAmount$.next(newUserBaseTokenAmount)
        this.bloc.newUserFarmingTokenAmount$.next(newUserFarmingTokenAmount)

        const a1 = new BigNumber(newPositionValue).multipliedBy(positionInfo.workFactorBps).toString()
        const a2 = new BigNumber(newDebtValue).multipliedBy(10 ** 4).toString()

        const _partialClosePositionAvailable = new BigNumber(a1).isGreaterThan(a2)
        this.bloc.partialCloseAvailable$.next(_partialClosePositionAvailable)
      })
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }

  renderEntireSummary = () => {
    const { farmingToken, baseToken, tokenPrices } = this.props
    const lpToken = this.bloc.lpToken$.value
    const poolInfo = klayswapPoolInfo$.value[lpToken && lpToken.address.toLowerCase()]

    switch (this.bloc.closingMethod$.value) {
      case 'minimizeTrading':
        return (
          <MinimizeTradingSummary
            poolInfo={poolInfo}
            tokenPrices={tokenPrices}
            farmingToken={farmingToken}
            baseToken={baseToken}
            positionValue={this.bloc.positionValue$.value}
            equityValue={this.bloc.equityValue$.value}
            debtValue={this.bloc.debtValue$.value}
            userFarmingTokenAmount={this.bloc.userFarmingTokenAmount$.value}
            userBaseTokenAmount={this.bloc.userBaseTokenAmount$.value}
          />
        )
      case 'convertToBaseToken':
        return !!this.bloc.positionValue$.value && (
          <ConvertToBaseTokenSummary
            poolInfo={poolInfo}
            tokenPrices={tokenPrices}
            farmingToken={farmingToken}
            baseToken={baseToken}
            positionValue={this.bloc.positionValue$.value}
            equityValue={this.bloc.equityValue$.value}
            debtValue={this.bloc.debtValue$.value}
            userFarmingTokenAmount={this.bloc.userFarmingTokenAmount$.value}
            userBaseTokenAmount={this.bloc.userBaseTokenAmount$.value}
          />
        )
    }
  }

  getDebtTokenKlevaRewardsAPR = (leverage) => {
    const { baseToken } = this.props
    const lendingTokenSupplyInfo = lendingTokenSupplyInfo$.value
    const borrowingAsset = baseToken

    const ibToken = getIbTokenFromOriginalToken(borrowingAsset)
    const debtToken = debtTokens[ibToken.address] || debtTokens[ibToken.address.toLowerCase()]
    const debtTokenPid = debtToken && debtToken.pid
    const klevaAnnualRewardForDebtToken = klevaAnnualRewards$.value[debtTokenPid]

    const _tokenInfo = lendingTokenSupplyInfo && lendingTokenSupplyInfo[borrowingAsset.address.toLowerCase()]
    const _debtTokenInfo = _tokenInfo && _tokenInfo.debtTokenInfo

    const klevaRewardsAPR = new BigNumber(klevaAnnualRewardForDebtToken)
      .multipliedBy(tokenPrices$.value[tokenList.KLEVA.address])
      .div(_tokenInfo && _tokenInfo.debtTokenTotalSupply)
      .multipliedBy(10 ** (_debtTokenInfo && _debtTokenInfo.decimals))
      .multipliedBy(leverage - 1)
      .multipliedBy(100)
      .toNumber()

    return klevaRewardsAPR || 0
  }
    
  render() {
    const { 
      title, 
      baseToken, 
      farmingToken,

      yieldFarmingAPRBefore,
      tradingFeeAPRBefore,
      klevaRewardsAPRBefore,
      borrowingInterestAPRBefore,
    } = this.props
    
    const finalLeverageValue = this.bloc.finalCalculatedLeverage$.value

    const before_totalAPR = new BigNumber(yieldFarmingAPRBefore)
      .plus(tradingFeeAPRBefore)
      .plus(klevaRewardsAPRBefore) // klevaRewards
      .minus(borrowingInterestAPRBefore) // borrowingInterest
      .toNumber()

    const before_debtRatio = new BigNumber(this.bloc.debtValue$.value)
      .div(this.bloc.positionValue$.value)
      .multipliedBy(100)
      .toNumber()

    const before_safetyBuffer = new BigNumber(this.bloc.liquidationThreshold$.value)
      .minus(before_debtRatio)
      .toNumber()

    const after_debtRatio = new BigNumber(this.bloc.newDebtValue$.value)
      .div(this.bloc.newPositionValue$.value)
      .multipliedBy(100)
      .toNumber()

    const after_safetyBuffer = new BigNumber(this.bloc.liquidationThreshold$.value)
      .minus(after_debtRatio)
      .toNumber()

    const after_yieldFarmingAPR = new BigNumber(yieldFarmingAPRBefore)
      .multipliedBy(finalLeverageValue)
      .div(this.bloc.currentPositionLeverage$.value)
      .toNumber()

    const after_tradingFeeAPR = new BigNumber(tradingFeeAPRBefore)
      .multipliedBy(finalLeverageValue)
      .div(this.bloc.currentPositionLeverage$.value)
      .toNumber()

    const after_klevaRewardsAPR = this.getDebtTokenKlevaRewardsAPR(finalLeverageValue)

    const after_borrowingInterestAPR = new BigNumber(borrowingInterestAPRBefore)
      .multipliedBy(finalLeverageValue - 1)
      .div(this.bloc.currentPositionLeverage$.value - 1)
      .toNumber()

    const after_totalAPR = new BigNumber(after_yieldFarmingAPR)
      .plus(after_tradingFeeAPR)
      .plus(after_klevaRewardsAPR) // klevaRewards
      .minus(after_borrowingInterestAPR) // borrowingInterest
      .toNumber()

    return (
      <div className="ClosePositionPopup">
        <Modal className="ClosePositionPopup__modal" title={title}>
          <div className="ClosePositionPopup">
            <p className="ClosePositionPopup__methodSelectTitle">Closing Method</p>
            <RadioSet
              className="ClosePositionPopup__radioSet"
              selectedValue={this.bloc.closingMethod$.value}
              list={[
                { title: "Minimize Trading", value: "minimizeTrading" }, 
                { title: `Convert to ${baseToken.title}`, value: "convertToBaseToken" },
              ]}
              setChange={(v) => this.bloc.closingMethod$.next(v)}
            />
            {this.renderEntireSummary()}
            {/* {this.bloc.entirelyClose$.value 
              ? this.renderEntireSummary()
              : <PartialController
                  farmingToken={farmingToken}
                  baseToken={baseToken}
                  userFarmingTokenAmount={this.bloc.userFarmingTokenAmount$.value}
                  userBaseTokenAmount={this.bloc.userBaseTokenAmount$.value}
                  debtValue={this.bloc.debtValue$.value}
                  partialCloseRatio$={this.bloc.partialCloseRatio$}
                  repayDebtRatio$={this.bloc.repayDebtRatio$}
                />
            } */}
          </div>
          {/* <Checkbox
            className="ClosePositionPopup__checkbox"
            label="Entirely Close"
            checked$={this.bloc.entirelyClose$}
          /> */}
          <button
            onClick={() => {
              // if (!this.bloc.entirelyClose$.value && !this.bloc.partialCloseAvailable$.value) return

              this.bloc.closePosition()
            }}
            className={cx("ClosePositionPopup__closePositionButton", {
              "ClosePositionPopup__closePositionButton--disabled": !this.bloc.entirelyClose$.value && !this.bloc.partialCloseAvailable$.value,
            })}
          >
            Close Position
          </button>
          {/* {!this.bloc.entirelyClose$.value && (
            <PartialClosePositionPopupSummary
              baseToken={baseToken}
              farmingToken={farmingToken}

              yieldFarmingBefore={yieldFarmingAPRBefore}
              yieldFarmingAfter={after_yieldFarmingAPR}

              safetyBufferBefore={before_safetyBuffer}
              safetyBufferAfter={after_safetyBuffer}

              tradingFeeAPRBefore={tradingFeeAPRBefore}
              tradingFeeAPRAfter={after_tradingFeeAPR}

              klevaRewardsAPRBefore={klevaRewardsAPRBefore}
              klevaRewardsAPRAfter={after_klevaRewardsAPR}

              borrowingInterestAPRBefore={borrowingInterestAPRBefore}
              borrowingInterestAPRAfter={after_borrowingInterestAPR}

              totalAPRBefore={before_totalAPR}
              totalAPRAfter={after_totalAPR}

              userFarmingTokenBefore={this.bloc.userFarmingTokenAmount$.value}
              userBaseTokenBefore={this.bloc.userBaseTokenAmount$.value}

              finalPositionIngredientBaseTokenAmount={new BigNumber(this.bloc.newUserBaseTokenAmount$.value).div(10 ** baseToken.decimals).toNumber()}
              finalPositionIngredientFarmingTokenAmount={new BigNumber(this.bloc.newUserFarmingTokenAmount$.value).div(10 ** farmingToken.decimals).toNumber()}

              debtValueBefore={this.bloc.debtValue$.value}
              debtValueAfter={this.bloc.newDebtValue$.value}

              debtRatioBefore={before_debtRatio}
              debtRatioAfter={after_debtRatio}
            />
          )} */}
        </Modal>
      </div>
    )
  }
}

export default ClosePositionPopup