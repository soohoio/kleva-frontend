import React, { Component, Fragment, createRef } from 'react'
import BigNumber from 'bignumber.js'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap, switchMap, filter } from 'rxjs/operators'

import SupplyingAssets from './SupplyingAssets'
import LeverageGauge from './LeverageGauge'
import BorrowMore from './BorrowMore'

import Bloc from './AdjustPositionPopup.bloc'

import Modal from './common/Modal'
import AdjustPositionPopupSummary from './AdjustPositionPopupSummary'
import APRAPYBrief from './APRAPYBrief'
import APRAPYDetailed from './APRAPYDetailed'
import Checkbox from './common/Checkbox'

import { borrowMore$, checkAllowances$ } from '../streams/contract'
import { klayswapPoolInfo$, klevaAnnualRewards$, positions$ } from '../streams/farming'
import { lendingTokenSupplyInfo$ } from '../streams/vault'
import { balancesInWallet$, selectedAddress$ } from '../streams/wallet'
import { debtTokens, getIbTokenFromOriginalToken, tokenList } from '../constants/tokens'
import { getEachTokenBasedOnLPShare } from '../utils/calc'

import './AdjustPositionPopup.scss'

class AdjustPositionPopup extends Component {
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

      this.bloc.farmingTokenAmount$,
      this.bloc.baseTokenAmount$,
      this.bloc.farmingTokenAmountInBaseToken$,
      this.bloc.leverage$,
      this.bloc.fetchAllowances$,
      this.bloc.borrowMore$,
      this.bloc.addCollateralAvailable$,
      this.bloc.borrowMoreAvailable$,
      
      this.bloc.equityValue$,
      this.bloc.debtValue$,

      this.bloc.amountToBeBorrowed$,

      this.bloc.afterPositionValue$,
      this.bloc.showAPRDetail$,
      this.bloc.showSummary$,

      merge(
        this.bloc.leverage$,
        positions$
      ).pipe(
        tap(() => {
          const positions = positions$.value
          const positionInfo = positions && positions.find(({ positionId }) => positionId == this.props.positionId)

          const positionValue = positionInfo && positionInfo.positionValue
          const debtValue = positionInfo && positionInfo.debtValue
          const equityValue = positionInfo && new BigNumber(positionInfo.positionValue).minus(debtValue)
          const lpShare = positionInfo && positionInfo.lpShare
          const lpToken = positionInfo && positionInfo.lpToken

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

          const currentPositionLeverage = new BigNumber(equityValue)
            .plus(debtValue)
            .div(equityValue)

          this.bloc.positionValue$.next(positionValueParsed)
          this.bloc.equityValue$.next(equityValueParsed)
          this.bloc.debtValue$.next(debtValueParsed)
          this.bloc.currentPositionLeverage$.next(currentPositionLeverage)

          if (!this.bloc.leverage$.value) {
            this.bloc.leverage$.next(this.bloc.currentPositionLeverage$.value)
          }

          const rawKillFactorBps = this.props.workerInfo && this.props.workerInfo.rawKillFactorBps
          const workFactorBps = this.props.workerInfo && this.props.workerInfo.workFactorBps

          // addCollateral available condition
          // (positionValue * rawKillFactor >= debtValue * 1e4)
          const _addCollateralAvailable = new BigNumber(positionValue)
            .multipliedBy(rawKillFactorBps)
            .gte(new BigNumber(debtValue).multipliedBy(10 ** 4))

          const amountToBorrow = new BigNumber(this.bloc.equityValue$.value)
            .multipliedBy(this.bloc.leverage$.value - 1)
            .multipliedBy(10 ** this.props.baseToken.decimals)
            .toFixed(0)

          const newPositionValue = new BigNumber(positionValue).plus(amountToBorrow).toString()
          const newDebtValue = new BigNumber(debtValue).plus(amountToBorrow).toString()

          const a1 = new BigNumber(newPositionValue).multipliedBy(workFactorBps).toString()
          const a2 = new BigNumber(newDebtValue).multipliedBy(10 ** 4).toString()

          const _borrowMoreAvailable = new BigNumber(a1).isGreaterThan(a2)

          // For Summary

          const poolInfo = klayswapPoolInfo$.value[lpToken && lpToken.address && lpToken.address.toLowerCase()]

          const { userFarmingTokenAmount, userBaseTokenAmount } = getEachTokenBasedOnLPShare({ 
            poolInfo, 
            lpShare, 
            farmingToken: this.props.farmingToken,
            baseToken: this.props.baseToken,
          })

          const amountToBeBorrowed = new BigNumber(this.bloc.equityValue$.value)
            .multipliedBy(this.bloc.leverage$.value - this.bloc.currentPositionLeverage$.value)
            .multipliedBy(10 ** this.props.baseToken.decimals)
            .toNumber(0)

          this.bloc.amountToBeBorrowed$.next(Math.max(0, amountToBeBorrowed))
          this.bloc.addCollateralAvailable$.next(_addCollateralAvailable)
          this.bloc.borrowMoreAvailable$.next(_borrowMoreAvailable)
        })
      ),
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })

    merge(
      this.bloc.fetchAllowances$,
      selectedAddress$.pipe(
        filter((a) => !!a),
      ),
    ).pipe(
      switchMap(() => {
        return checkAllowances$(
          selectedAddress$.value,
          this.props.vaultAddress,
          [this.props.baseToken, this.props.farmingToken]
        )
      }),
      tap((allowances) => {
        this.bloc.allowances$.next(allowances)
      }),
      takeUntil(this.destroy$)
    ).subscribe()
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }

  renderButton = () => {
    const { baseToken, farmingToken: _farmingToken, vaultAddress } = this.props

    // KLAY -> WKLAY
    const isFarmingTokenKLAY = this.bloc.isKLAY(_farmingToken && _farmingToken.address)

    const farmingToken = isFarmingTokenKLAY
      ? tokenList.WKLAY
      : _farmingToken

    const baseTokenAllowance = this.bloc.allowances$.value[baseToken.address]

    const isBaseTokenApproved = this.bloc.isKLAY(baseToken.address)
      || this.bloc.baseTokenAmount$.value === 0
      || (baseTokenAllowance && baseTokenAllowance != 0)

    const farmingTokenAllowance = this.bloc.allowances$.value[farmingToken.address]

    const isFarmingTokenApproved = this.bloc.farmingTokenAmount$.value == 0
      || (farmingTokenAllowance && farmingTokenAllowance != 0)

    // Base Token Allowance Check
    if (!isBaseTokenApproved) {
      return (
        <button
          onClick={() => this.bloc.approve(baseToken, vaultAddress)}
          className="AddPositionPopup__farmButton"
        >
          Approve {baseToken.title}
        </button>
      )
    }

    // Farming Token Allowance Check
    if (!isFarmingTokenApproved) {
      return (
        <button
          onClick={() => this.bloc.approve(farmingToken, vaultAddress)}
          className="AddPositionPopup__farmButton"
        >
          Approve {farmingToken.title}
        </button>
      )
    }

    const isAddCollateralDisabled = this.bloc.baseTokenAmount$.value == 0
      && this.bloc.farmingTokenAmount$.value == 0
      || !this.bloc.addCollateralAvailable$.value 

    const isBorrowMoreDisabled = (this.bloc.leverage$.value == this.bloc.currentPositionLeverage$.value) 
      || !this.bloc.borrowMoreAvailable$.value

    const isDisabled = this.bloc.borrowMore$.value  
      ? isBorrowMoreDisabled
      : isAddCollateralDisabled

    return (
      <button
        onClick={() => {
          if (isDisabled) return

          if (!!this.bloc.borrowMore$.value) {
            this.bloc.borrowMore()
            return
          }

          this.bloc.addCollateral()

        }}
        className={cx("AddPositionPopup__farmButton", {
          "AddPositionPopup__farmButton--disabled": isDisabled,
        })}
      >
        {this.bloc.borrowMore$.value 
          ? `Borrow More`
          : `Add Collateral`
        }
        {/* Farm {Number(this.bloc.leverage$.value).toFixed(2)}x */}
      </button>
    )
  }

  getDebtTokenKlevaRewardsAPR = () => {
    const { baseToken } = this.props
    const lendingTokenSupplyInfo = lendingTokenSupplyInfo$.value
    const borrowingAsset = baseToken

    const ibToken = getIbTokenFromOriginalToken(borrowingAsset)
    const debtToken = debtTokens[ibToken.address] || debtTokens[ibToken.address.toLowerCase()]
    const debtTokenPid = debtToken && debtToken.pid
    const klevaAnnualRewardForDebtToken = klevaAnnualRewards$.value[debtTokenPid]

    // const farmTVL = new BigNumber(farmDeposited && farmDeposited.deposited)
    //   .multipliedBy(tokenPrices[farmDeposited && farmDeposited.lpToken && farmDeposited.lpToken.address.toLowerCase()])

    const _tokenInfo = lendingTokenSupplyInfo && lendingTokenSupplyInfo[borrowingAsset.address.toLowerCase()]
    const _debtTokenInfo = _tokenInfo && _tokenInfo.debtTokenInfo

    const klevaRewardsAPR = new BigNumber(klevaAnnualRewardForDebtToken)
      .multipliedBy(tokenPrices$.value[tokenList.KLEVA.address])
      .div(_tokenInfo && _tokenInfo.debtTokenTotalSupply)
      .multipliedBy(10 ** (_debtTokenInfo && _debtTokenInfo.decimals))
      .multipliedBy(this.bloc.leverage$.value - 1)
      .multipliedBy(100)
      .toNumber()

    return klevaRewardsAPR || 0
  }
    
  render() {
    const { 
      title,
      farmingToken,
      baseToken,
      positionId,
      vaultAddress,
      workerInfo,
      leverageCap,

      yieldFarmingAPR,
      tradingFeeAPR,
      klevaRewardsAPR,
      borrowingInterestAPR,
    } = this.props

    // const workerConfig = workerInfo &&
    //   workerInfo[this.bloc.worker$.value.workerAddress.toLowerCase()] || workerInfo[this.bloc.worker$.value.workerAddress]

    // const leverageCap = 10000 / (10000 - workerConfig.workFactorBps)

    // const klevaRewardsAPR = this.getDebtTokenKlevaRewardsAPR()

    // const borrowingInfo = lendingTokenSupplyInfo$.value && lendingTokenSupplyInfo$.value[baseToken && baseToken.address.toLowerCase()]
    // const borrowingInterestAPR = borrowingInfo
    //   && new BigNumber(borrowingInfo.borrowingInterest)
    //     .multipliedBy(this.bloc.leverage$.value - 1)
    //     .toNumber()

    const totalAPR = new BigNumber(yieldFarmingAPR)
      .plus(tradingFeeAPR)
      .plus(klevaRewardsAPR) // klevaRewards
      .minus(borrowingInterestAPR) // borrowingInterest
      .toNumber()

    const totalAPRAfter = new BigNumber(totalAPR)
      .multipliedBy(this.bloc.leverage$.value)
      .toNumber()

    // const borrowingAmount = new BigNumber(this.bloc.getAmountToBorrow())
    //   .div(10 ** baseToken.decimals)
    //   .toNumber()

    // const farmingTokenAmountInBaseToken = this.bloc.farmingTokenAmountInBaseToken$.value

    return (
      <Modal className="AdjustPositionPopup__modal" title={title}>
        {this.bloc.showAPRDetail$.value && (
          <APRAPYDetailed
            showDetail$={this.bloc.showAPRDetail$}
            totalAPRBefore={totalAPR}
            totalAPRAfter={totalAPRAfter}

            yieldFarmingBefore={yieldFarmingAPR}
            yieldFarmingAfter={
              new BigNumber(yieldFarmingAPR)
                .multipliedBy(this.bloc.leverage$.value)
                .toNumber()
            }

            tradingFeeBefore={tradingFeeAPR}
            tradingFeeAfter={
              new BigNumber(tradingFeeAPR)
                .multipliedBy(this.bloc.leverage$.value)
                .toNumber()
            }

            klevaRewardAPR={klevaRewardsAPR}

            borrowingInterestAPR={borrowingInterestAPR}
          />
        )}
        <div className="AdjustPositionPopup">
          <div className="AdjustPositionPopup__content">
            <APRAPYBrief
              totalAPRBefore={totalAPR}
              totalAPRAfter={totalAPRAfter}
              showDetail$={this.bloc.showAPRDetail$}
            />
            <div className="AdjustPositionPopup__controller">
              <SupplyingAssets
                title="Adding Collateral"
                balances={balancesInWallet$.value}

                farmingToken={farmingToken}
                baseToken={baseToken}

                farmingTokenAmount$={this.bloc.farmingTokenAmount$}
                baseTokenAmount$={this.bloc.baseTokenAmount$}
              />
              <BorrowMore
                equityValue={this.bloc.equityValue$.value}
                debtValue={this.bloc.debtValue$.value}
                borrowingAsset={baseToken}
                leverageCap={leverageCap}
                borrowMore$={this.bloc.borrowMore$}
                leverage$={this.bloc.leverage$}
              />
            </div>
          </div>
          <Checkbox
            className="AdjustPositionPopup__summaryCheckbox"
            label="Summary"
            checked$={this.bloc.showSummary$}
          />
          {this.renderButton()}
        </div>
        {this.bloc.showSummary$.value && (
          <AdjustPositionPopupSummary
            showDetail$={this.bloc.showSummary$}
            baseToken={baseToken}
            farmingToken={farmingToken}
            debtValueBefore={this.bloc.debtValue$.value}
            amountToBeBorrowed={this.bloc.amountToBeBorrowed$.value}
          />
        )}
      </Modal>
    )
  }
}

export default AdjustPositionPopup