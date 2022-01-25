import React, { Component, Fragment, createRef } from 'react'
import BigNumber from 'bignumber.js'
import cx from 'classnames'
import { Subject, merge, forkJoin, of } from 'rxjs'
import { takeUntil, tap, switchMap, filter, distinctUntilChanged, debounceTime } from 'rxjs/operators'

import SupplyingAssets from './SupplyingAssets'
import LeverageGauge from './LeverageGauge'
import BorrowMore from './BorrowMore'

import Bloc from './AdjustPositionPopup.bloc'

import Modal from './common/Modal'
import AdjustPositionPopupSummary from './AdjustPositionPopupSummary'
import APRAPYBrief from './APRAPYBrief'
import APRAPYDetailed from './APRAPYDetailed'
import Checkbox from './common/Checkbox'

import { borrowMore$, checkAllowances$, getOutputAmount$, getOutputTokenAmount$ } from '../streams/contract'
import { klayswapPoolInfo$, klevaAnnualRewards$, positions$ } from '../streams/farming'
import { lendingTokenSupplyInfo$ } from '../streams/vault'
import { balancesInWallet$, selectedAddress$ } from '../streams/wallet'
import { debtTokens, getIbTokenFromOriginalToken, tokenList } from '../constants/tokens'
import { calcKlevaRewardsAPR, getEachTokenBasedOnLPShare } from '../utils/calc'

import './AdjustPositionPopup.scss'
import AdjustPositionPopupOptionSwitcher from './AdjustPositionPopupOptionSwitcher'
import { tokenPrices$ } from '../streams/tokenPrice'
import { addressKeyFind } from '../utils/misc'

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
      tokenPrices$,

      this.bloc.farmingTokenAmount$.pipe(
        tap(() => {
          this.bloc.calcFarmingTokenAmountInBaseToken()
        })
      ),

      this.bloc.isLoading$,

      this.bloc.baseTokenAmount$,
      this.bloc.farmingTokenAmountInBaseToken$,
      this.bloc.leverage$, // for borrowMore
      this.bloc.finalCalculatedLeverage$, // finally calculated after adjusting
      this.bloc.fetchAllowances$,
      this.bloc.addCollateralAvailable$,
      this.bloc.borrowMoreAvailable$,
      this.bloc.isDebtSizeValid$,
      
      this.bloc.equityValue$,
      this.bloc.debtValue$,

      this.bloc.newEquityValue$,
      this.bloc.newDebtValue$,
      this.bloc.newPositionValue$,
      this.bloc.lpShare$,
      this.bloc.lpToken$,

      this.bloc.before_userFarmingTokenAmount$,
      this.bloc.before_userBaseTokenAmount$,

      this.bloc.finalPositionIngredientBaseTokenAmount$,
      this.bloc.finalPositionIngredientFarmingTokenAmount$,

      this.bloc.amountToBeBorrowed$,
      this.bloc.liquidationThreshold$,

      this.bloc.afterPositionValue$,
      this.bloc.showAPRDetail$,
      this.bloc.showSummary$,
      this.bloc.priceImpact$,
      this.bloc.borrowMore$.pipe(
        distinctUntilChanged(),
        tap(() => {
          // Reset all
          this.bloc.farmingTokenAmount$.next('')
          this.bloc.baseTokenAmount$.next('')
          this.bloc.farmingTokenAmountInBaseToken$.next('')
          this.bloc.leverage$.next(this.bloc.currentPositionLeverage$.value)
          this.bloc.before_userFarmingTokenAmount$.next('')
          this.bloc.before_userBaseTokenAmount$.next('')
          this.bloc.newEquityValue$.next('')
          this.bloc.newDebtValue$.next('')
          this.bloc.newPositionValue$.next('')
          this.bloc.amountToBeBorrowed$.next('')
          this.bloc.addCollateralAvailable$.next('')
          this.bloc.borrowMoreAvailable$.next('')
          this.bloc.priceImpact$.next('')
          this.bloc.finalPositionIngredientBaseTokenAmount$.next('')
          this.bloc.finalPositionIngredientFarmingTokenAmount$.next('')
        })
      ),

      merge(
        this.bloc.farmingTokenAmount$,
        this.bloc.baseTokenAmount$,
        this.bloc.farmingTokenAmountInBaseToken$,
        this.bloc.leverage$,
        positions$
      ).pipe(
        debounceTime(100),
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

            // Liquidiation Threshold
          const liquidationThreshold = positionInfo && (new BigNumber(positionInfo.killFactorBps).div(100).toNumber())
          this.bloc.liquidationThreshold$.next(liquidationThreshold)

          this.bloc.positionValue$.next(positionValueParsed)
          this.bloc.equityValue$.next(equityValueParsed)
          this.bloc.debtValue$.next(debtValueParsed)
          this.bloc.currentPositionLeverage$.next(currentPositionLeverage)

          this.bloc.lpShare$.next(lpShare)
          this.bloc.lpToken$.next(lpToken)

          if (!this.bloc.leverage$.value) {
            this.bloc.leverage$.next(this.bloc.currentPositionLeverage$.value)
          }

          const rawKillFactorBps = this.props.workerInfo && this.props.workerInfo.rawKillFactorBps
          const workFactorBps = this.props.workerInfo && this.props.workerInfo.workFactorBps

          const amountToBorrow = new BigNumber(this.bloc.equityValue$.value)
            .multipliedBy(this.bloc.leverage$.value - 1)
            .multipliedBy(10 ** this.props.baseToken.decimals)
            .toFixed(0)

          const amountToBeBorrowed = new BigNumber(this.bloc.equityValue$.value)
            .multipliedBy(this.bloc.leverage$.value - this.bloc.currentPositionLeverage$.value)
            .multipliedBy(10 ** this.props.baseToken.decimals)
            .toNumber(0)

          // Finally calculate leverage value
          const amountToCollateral = new BigNumber(this.bloc.baseTokenAmount$.value || 0)
            .multipliedBy(10 ** this.props.baseToken.decimals)
            .plus(this.bloc.farmingTokenAmountInBaseToken$.value || 0)
            .toNumber()
          
          const newEquityValue = new BigNumber(equityValue)
            .plus(amountToCollateral)
            .toString()

          const newDebtValue = new BigNumber(debtValue)
            .plus(amountToBeBorrowed)
            .toString()

          const newPositionValue = new BigNumber(newEquityValue)
            .plus(newDebtValue)
            .toString()

          const finalCalculatedLeverage = new BigNumber(newPositionValue).div(newEquityValue).toNumber()
          this.bloc.finalCalculatedLeverage$.next(finalCalculatedLeverage)

          const ibToken = getIbTokenFromOriginalToken(this.props.baseToken)
          const isDebtSizeValid = newDebtValue == 0 || new BigNumber(newDebtValue).gte(ibToken?.minDebtSize)

          const a1 = new BigNumber(newPositionValue).multipliedBy(workFactorBps).toString()
          const a2 = new BigNumber(newDebtValue).multipliedBy(10 ** 4).toString()

          const _borrowMoreAvailable = new BigNumber(a1).isGreaterThan(a2)

          // addCollateral available condition
          // (positionValue * rawKillFactor >= debtValue * 1e4)
          const _addCollateralAvailable = new BigNumber(newPositionValue)
            .multipliedBy(rawKillFactorBps)
            .gte(new BigNumber(debtValue).multipliedBy(10 ** 4))

          // For Summary

          const poolInfo = klayswapPoolInfo$.value[lpToken && lpToken.address && lpToken.address.toLowerCase()]

          const { userFarmingTokenAmount, userBaseTokenAmount } = getEachTokenBasedOnLPShare({ 
            poolInfo, 
            lpShare, 
            farmingToken: this.props.farmingToken,
            baseToken: this.props.baseToken,
          })

          this.bloc.before_userFarmingTokenAmount$.next(userFarmingTokenAmount)
          this.bloc.before_userBaseTokenAmount$.next(userBaseTokenAmount)

          this.bloc.newEquityValue$.next(newEquityValue)
          this.bloc.newDebtValue$.next(newDebtValue)
          this.bloc.newPositionValue$.next(newPositionValue)
          
          this.bloc.amountToBeBorrowed$.next(Math.max(0, amountToBeBorrowed))
          this.bloc.addCollateralAvailable$.next(_addCollateralAvailable)

          this.bloc.isDebtSizeValid$.next(isDebtSizeValid)
          this.bloc.borrowMoreAvailable$.next(isDebtSizeValid && _borrowMoreAvailable)

          // Calculate Price Impact

          // if (!this.bloc.farmingTokenAmountInBaseToken$.value) {
          //   return
          // }

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

          if (this.bloc.borrowMore$.value) {

            const finalPositionIngredientBaseTokenAmount = new BigNumber(userBaseTokenAmount)
              .multipliedBy(10 ** this.props.baseToken.decimals)
              .plus(new BigNumber(amountToBeBorrowed).div(2))
              .toNumber()

            const finalPositionIngredientFarmingTokenAmount = new BigNumber(finalPositionIngredientBaseTokenAmount)
              .multipliedBy(baseTokenPriceInFarmingToken)
              .toNumber()

            this.bloc.finalPositionIngredientBaseTokenAmount$.next(finalPositionIngredientBaseTokenAmount)
            this.bloc.finalPositionIngredientFarmingTokenAmount$.next(finalPositionIngredientFarmingTokenAmount)

            this.bloc.finalPositionIngredientBaseTokenAmount$.next(
              new BigNumber(finalPositionIngredientBaseTokenAmount).div(10 ** this.props.baseToken.decimals).toNumber()
            )
            this.bloc.finalPositionIngredientFarmingTokenAmount$.next(
              new BigNumber(finalPositionIngredientFarmingTokenAmount).div(10 ** this.props.farmingToken.decimals).toNumber()
            )

            getOutputTokenAmount$(
              this.props.baseToken, 
              this.props.farmingToken, 
              new BigNumber(amountToBeBorrowed).gte(0)
                ? new BigNumber(amountToBeBorrowed).div(2).toFixed(0)
                : 0
            ).subscribe(({ priceImpact }) => {
              this.bloc.priceImpact$.next(priceImpact)
            })
          } else {

            // const farmingTokenPriceInBaseToken = new BigNumber(_ba).div(_fa).toNumber()
            
            const baseTokenAmountPure = new BigNumber(this.bloc.baseTokenAmount$.value || 0)
              .multipliedBy(10 ** this.props.baseToken.decimals)
              .toFixed(0)
            
            const farmingTokenAmountPure = new BigNumber(this.bloc.farmingTokenAmount$.value || 0)
              .multipliedBy(10 ** this.props.farmingToken.decimals)
              .toFixed(0)

            const finalPositionIngredientBaseTokenAmount = new BigNumber(userBaseTokenAmount)
            .multipliedBy(10 ** this.props.baseToken.decimals)
            .plus(
              new BigNumber(this.bloc.farmingTokenAmountInBaseToken$.value)
                .plus(baseTokenAmountPure || 0)
                .div(2)
            ).toFixed(0)

            const finalPositionIngredientFarmingTokenAmount = new BigNumber(finalPositionIngredientBaseTokenAmount)
              .multipliedBy(baseTokenPriceInFarmingToken)
              .toFixed(0)

            const farmingTokenAmountToTrade = new BigNumber(finalPositionIngredientFarmingTokenAmount)
              .minus(farmingTokenAmountPure || 0)
              .toFixed(0)

            const baseTokenAmountToTrade = new BigNumber(finalPositionIngredientBaseTokenAmount)
              .minus(baseTokenAmountPure || 0)
              .toFixed(0)

            this.bloc.finalPositionIngredientBaseTokenAmount$.next(
              new BigNumber(finalPositionIngredientBaseTokenAmount)
                .div(10 ** this.props.baseToken.decimals)
                .toNumber(0)
            )
            this.bloc.finalPositionIngredientFarmingTokenAmount$.next(
              new BigNumber(finalPositionIngredientFarmingTokenAmount)
                .div(10 ** this.props.farmingToken.decimals)
                .toNumber(0)
            )

            forkJoin(
              Number(farmingTokenAmountToTrade) > 0 
                ? getOutputTokenAmount$(this.props.farmingToken, this.props.baseToken, farmingTokenAmountToTrade)
                : of({ priceImpact: 0 }),
              Number(baseTokenAmountToTrade) > 0 
                ? getOutputTokenAmount$(this.props.baseToken, this.props.farmingToken, baseTokenAmountToTrade)
                : of({ priceImpact: 0 }),
            ).subscribe(([a, b]) => {
              const priceImpact = (a.priceImpact + b.priceImpact)
              this.bloc.priceImpact$.next(priceImpact)
            })
          }
        })
      ),
    ).pipe(
      debounceTime(1),
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

    if (this.bloc.isLoading$.value) {
      return (
        <button
          className="AddPositionPopup__farmButton"
        >
          ...
        </button>
      )
    }

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

    const isAddCollateralDisabled = (this.bloc.baseTokenAmount$.value == 0 && this.bloc.farmingTokenAmount$.value == 0) 
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
      </button>
    )
  }

  getDebtTokenKlevaRewardsAPR = (leverage) => {
    const { baseToken } = this.props
    const lendingTokenSupplyInfo = lendingTokenSupplyInfo$.value
    const borrowingAsset = baseToken

    return calcKlevaRewardsAPR({
      lendingTokenSupplyInfo,
      borrowingAsset,
      debtTokens,
      klevaAnnualRewards: klevaAnnualRewards$.value,
      klevaTokenPrice: tokenPrices$.value[tokenList.KLEVA.address.toLowerCase()],
      leverage,
    })
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

      yieldFarmingAPRBefore,
      tradingFeeAPRBefore,
      klevaRewardsAPRBefore,
      borrowingInterestAPRBefore,

      baseBorrowingInterestAPR,
    } = this.props

    const ibToken = getIbTokenFromOriginalToken(baseToken)

    // Final Caluclated Leverage Value
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

    const after_borrowingInterestAPR = new BigNumber(baseBorrowingInterestAPR)
      .multipliedBy(finalLeverageValue - 1)
      .toNumber()

    const after_totalAPR = new BigNumber(after_yieldFarmingAPR)
      .plus(after_tradingFeeAPR)
      .plus(after_klevaRewardsAPR) // klevaRewards
      .minus(after_borrowingInterestAPR) // borrowingInterest
      .toNumber()

    return (
      <Modal className="AdjustPositionPopup__modal" title={title}>
        {this.bloc.showAPRDetail$.value && (
          <APRAPYDetailed
            showDetail$={this.bloc.showAPRDetail$}
            
            totalAPRBefore={before_totalAPR}
            totalAPRAfter={after_totalAPR}

            yieldFarmingBefore={yieldFarmingAPRBefore}
            yieldFarmingAfter={after_yieldFarmingAPR}

            tradingFeeBefore={tradingFeeAPRBefore}
            tradingFeeAfter={after_tradingFeeAPR}
            
            klevaRewardsAPRBefore={klevaRewardsAPRBefore}
            klevaRewardsAPRAfter={after_klevaRewardsAPR}

            borrowingInterestAPRBefore={borrowingInterestAPRBefore}
            borrowingInterestAPRAfter={after_borrowingInterestAPR}
          />
        )}
        <div className="AdjustPositionPopup">
          <div className="AdjustPositionPopup__content">
            <APRAPYBrief
              totalAPRBefore={before_totalAPR}
              totalAPRAfter={after_totalAPR}

              yieldFarmingBefore={yieldFarmingAPRBefore}
              yieldFarmingAfter={after_yieldFarmingAPR}

              tradingFeeBefore={tradingFeeAPRBefore}
              tradingFeeAfter={after_tradingFeeAPR}

              klevaRewardsAPRBefore={klevaRewardsAPRBefore}
              klevaRewardsAPRAfter={after_klevaRewardsAPR}

              borrowingInterestAPRBefore={borrowingInterestAPRBefore}
              borrowingInterestAPRAfter={after_borrowingInterestAPR}
              
              showDetail$={this.bloc.showAPRDetail$}
            />
            <AdjustPositionPopupOptionSwitcher
              baseToken={baseToken}
              borrowMore$={this.bloc.borrowMore$}
            >
              <div className="AdjustPositionPopup__controller">
                {!this.bloc.borrowMore$.value
                  ? (
                    <SupplyingAssets
                      title="Adding Collateral"
                      balances={balancesInWallet$.value}

                      farmingToken={farmingToken}
                      baseToken={baseToken}

                      farmingTokenAmount$={this.bloc.farmingTokenAmount$}
                      baseTokenAmount$={this.bloc.baseTokenAmount$}
                    />
                  )
                  : (
                    <BorrowMore
                      equityValue={this.bloc.equityValue$.value}
                      debtValue={this.bloc.debtValue$.value}
                      borrowingAsset={baseToken}
                      leverageCap={leverageCap}
                      borrowMore$={this.bloc.borrowMore$}
                      leverage$={this.bloc.leverage$}
                    />
                  )}
              </div>
            </AdjustPositionPopupOptionSwitcher>
          </div>
        </div>
        {this.bloc.showSummary$.value && (
          <AdjustPositionPopupSummary
            borrowMore={this.bloc.borrowMore$.value}
            showDetail$={this.bloc.showSummary$}
            baseToken={baseToken}
            farmingToken={farmingToken}
            
            debtValueBefore={this.bloc.debtValue$.value}
            amountToBeBorrowed={this.bloc.amountToBeBorrowed$.value}

            yieldFarmingBefore={yieldFarmingAPRBefore}
            yieldFarmingAfter={after_yieldFarmingAPR}

            safetyBufferBefore={before_safetyBuffer}
            safetyBufferAfter={after_safetyBuffer}

            userFarmingTokenBefore={this.bloc.before_userFarmingTokenAmount$.value}
            userBaseTokenBefore={this.bloc.before_userBaseTokenAmount$.value}

            userFarmingTokenAmountToAdd={this.bloc.farmingTokenAmount$.value}
            userBaseTokenAmountToAdd={this.bloc.baseTokenAmount$.value}

            newDebtValue={this.bloc.newDebtValue$.value}

            priceImpact={this.bloc.priceImpact$.value}

            finalPositionIngredientBaseTokenAmount={this.bloc.finalPositionIngredientBaseTokenAmount$.value}
            finalPositionIngredientFarmingTokenAmount={this.bloc.finalPositionIngredientFarmingTokenAmount$.value}
          />
        )}
        <Checkbox
          className="AdjustPositionPopup__summaryCheckbox"
          label="Summary"
          checked$={this.bloc.showSummary$}
        />
        {!!this.bloc.borrowMore$.value && !this.bloc.isDebtSizeValid$.value && (
          <p className="AdjustPositionPopup__minDebtSize">
            Minimum Debt Size: {nFormatter(new BigNumber(ibToken.minDebtSize).div(10 ** ibToken.decimals).toNumber(), 2)} {baseToken?.title}
          </p>
        )}
        {this.renderButton()}
      </Modal>
    )
  }
}

export default AdjustPositionPopup