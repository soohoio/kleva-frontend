import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, interval, forkJoin } from 'rxjs'
import { switchMap, distinctUntilChanged, startWith, takeUntil, tap, map, debounceTime } from 'rxjs/operators'

import Modal from 'components/common/Modal'

import './ClosePositionPopup.scss'
import ConvertToBaseTokenSummary from './ConvertToBaseTokenSummary'

import Bloc from './ClosePositionPopup.bloc'
import MinimizeTradingSummary from './MinimizeTradingSummary'

import RadioSet from 'components/common/RadioSet'
import Checkbox from './common/Checkbox'
import PartialController from './PartialController'
import PartialClosePositionPopupSummary from './PartialClosePositionPopupSummary'
import AreYouSureFarming from './common/AreYouSureFarming'
import { closeLayeredModal$, openLayeredModal$ } from '../streams/ui'

import { klayswapPoolInfo$, klevaAnnualRewards$, positions$ } from '../streams/farming'
import { lendingTokenSupplyInfo$ } from '../streams/vault'
import { balancesInWallet$, selectedAddress$ } from '../streams/wallet'
import { getIbTokenFromOriginalToken, tokenList } from '../constants/tokens'
import { getBufferedWorkFactorBps, getEachTokenBasedOnLPShare } from '../utils/calc'
import { isSameAddress } from '../utils/misc'

import { getDebtRepaymentRange$ } from 'streams/contract'

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

      this.bloc.isLoading$,
      this.bloc.positionValue$,
      this.bloc.equityValue$,
      this.bloc.debtValue$,
      this.bloc.health$,
      this.bloc.closingMethod$,
      this.bloc.userFarmingTokenAmount$,
      this.bloc.userBaseTokenAmount$,

      this.bloc.lpShare$,
      this.bloc.lpAmount$,

      this.bloc.lpToken$,
      this.bloc.entirelyClose$.pipe(
        distinctUntilChanged(() => {

          // @HOTFIX: If partial close, and the farm is related to KLAY,
          // Don't allow 'minimizeTrading'
          // if (!this.bloc.entirelyClose$.value && this.isKLAYRelatedPool()) {
          //   this.bloc.closingMethod$.next('convertToBaseToken')
          // }

          this.bloc.partialCloseRatio$.next(0)
          this.bloc.partialCloseAvailable$.next({})
        })
      ),

      this.bloc.newPositionValue$,
      this.bloc.newDebtValue$,
      this.bloc.liquidationThreshold$,
      this.bloc.currentPositionLeverage$,
      this.bloc.finalCalculatedLeverage$,

      this.bloc.newUserFarmingTokenAmount$,
      this.bloc.newUserBaseTokenAmount$,

      this.bloc.debtRepaymentAmount$,
      this.bloc.repayPercentageLimit$,

      this.bloc.partialCloseRatio$.pipe(
        tap(() => {
          this.bloc.repayDebtRatio$.next(0)
          this.bloc.debtRepaymentAmount$.next(0)
        })
      ),
      this.bloc.repayDebtRatio$,
      this.bloc.partialCloseAvailable$,

      klayswapPoolInfo$,
    ).pipe(
      debounceTime(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })

    merge(
      positions$,
      // Partial Close
      this.bloc.entirelyClose$,
      this.bloc.partialCloseRatio$,
      this.bloc.repayDebtRatio$,
    ).pipe(
      map(() => {
        const positionInfo = positions$.value && positions$.value.find(({ id }) => id == this.props.id)
        return positionInfo
      }),
      tap((positionInfo) => {
        const { farmingToken, baseToken, workerInfo, positionId } = this.props

        const positionValue = positionInfo && positionInfo.positionValue
        const health = positionInfo && positionInfo.health
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

        const { userFarmingTokenAmount, userBaseTokenAmount, lpAmount } = getEachTokenBasedOnLPShare({
          poolInfo,
          lpShare,
          farmingToken,
          baseToken,
          totalShare: positionInfo.totalShare,
          totalStakedLpBalance: positionInfo.totalStakedLpBalance,
        })

        const positionValueParsed = new BigNumber(positionValue)
          .div(10 ** this.props.baseToken.decimals)
          .toNumber()
        // .toLocaleString('en-us', { maximumFractionDigits: 6 })

        const equityValueParsed = new BigNumber(positionValue)
          .minus(debtValue)
          .div(10 ** this.props.baseToken.decimals)
          .toNumber()
        // .toLocaleString('en-us', { maximumFractionDigits: 6 })

        const debtValueParsed = new BigNumber(debtValue)
          .div(10 ** this.props.baseToken.decimals)
          .toNumber()
        // .toLocaleString('en-us', { maximumFractionDigits: 6 })

        this.bloc.lpToken$.next(lpToken)
        this.bloc.lpShare$.next(lpShare)
        this.bloc.lpAmount$.next(lpAmount)

        this.bloc.positionValue$.next(positionValueParsed)
        this.bloc.equityValue$.next(equityValueParsed)
        this.bloc.debtValue$.next(debtValueParsed)
        this.bloc.userFarmingTokenAmount$.next(userFarmingTokenAmount)
        this.bloc.userBaseTokenAmount$.next(userBaseTokenAmount)

        if (this.bloc.entirelyClose$.value) return

        const ibToken = getIbTokenFromOriginalToken(this.props.baseToken)

        // Partial Close check
        const closedLpAmt = new BigNumber(lpAmount).multipliedBy(this.bloc.partialCloseRatio$.value).div(100).toFixed(0)

        return getDebtRepaymentRange$({
          workerAddress: workerInfo?.workerAddress,
          positionId,
          closedLpAmt,
        }).subscribe(({
          closedPositionValue,
          closedHealth,
          minDebtRepayment,
          maxDebtRepayment,
        }) => {
          const newPositionValue = new BigNumber(positionValue)
            .minus(closedPositionValue)
            .toString()

          const newHealth = new BigNumber(health)
            .minus(closedHealth)
            .toString()

          const debtRepayment = new BigNumber(closedPositionValue)
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
          this.bloc.debtRepaymentAmount$.next(debtRepayment)

          const {
            userFarmingTokenAmountPure: newUserFarmingTokenAmount,
            userBaseTokenAmountPure: newUserBaseTokenAmount,
          } = getEachTokenBasedOnLPShare({
            poolInfo,
            // lpShare: 1 * 10 ** lpToken.decimals,
            lpShare: new BigNumber(this.bloc.lpShare$.value)
              .multipliedBy((100 - this.bloc.partialCloseRatio$.value))
              .div(100)
              .toString(),
            farmingToken: this.props.farmingToken,
            baseToken: this.props.baseToken,
            totalShare: positionInfo.totalShare,
            totalStakedLpBalance: positionInfo.totalStakedLpBalance,
          })

          this.bloc.newUserBaseTokenAmount$.next(newUserBaseTokenAmount)
          this.bloc.newUserFarmingTokenAmount$.next(newUserFarmingTokenAmount)

          const bufferedWorkFactorBps = getBufferedWorkFactorBps(positionInfo.workFactorBps)

          const a1 = new BigNumber(newHealth).multipliedBy(bufferedWorkFactorBps).toString()
          const a2 = new BigNumber(newDebtValue).multipliedBy(10 ** 4).toString()

          const isDebtSizeValid = newDebtValue == 0 || new BigNumber(newDebtValue).gte(ibToken?.minDebtSize)

          const minDebtSizeParsed = new BigNumber(ibToken?.minDebtSize).div(10 ** ibToken?.decimals).toString()

          const neededRepayAmount = new BigNumber(debtValue)
            .minus(new BigNumber(a1).div(10 ** 4))
            .div(10 ** this.props.baseToken.decimals)
            .toFixed(4)

          const neededRepayAmountInGaugeRatio = new BigNumber(neededRepayAmount)
            .multipliedBy(10 ** this.props.baseToken.decimals)
            .div(closedPositionValue)
            .multipliedBy(100)
            .toFixed(2)

          // Calculate Debt Repay Percentage Limit
          const repayPercentageLimit = new BigNumber(maxDebtRepayment)
            .div(closedPositionValue)
            .multipliedBy(100)
            .toString()

          const availableMaxPartialCloseRatio = new BigNumber(1)
            .minus(
              new BigNumber(ibToken?.minDebtSize)
                .multipliedBy(10 ** 4)
                .div(new BigNumber(health).multipliedBy(bufferedWorkFactorBps))
            )
            .multipliedBy(100)
            .multipliedBy(0.99) // 1% buffer
            .toString()

          // Impossible Partial Close Ratio Situation
          // 1) repay debt ratio should be A,
          // 2) But when the ratio becomes A, the position can't meet min debt size criteria.
          // So in this case, you can't execute 'partial close'.
          const isImpossiblePartialCloseRatio = new BigNumber(debtValue).minus(
            new BigNumber(neededRepayAmount).multipliedBy(10 ** this.props.baseToken?.decimals)
          ).lt(ibToken?.minDebtSize)

          const isDebtTooLow = new BigNumber(debtValue).lte(ibToken?.minDebtSize)

          const isYouMustRepayMoreSituation = (neededRepayAmount != 0) && !(new BigNumber(a1).isGreaterThan(a2))

          const isAvailablePartialCloseRatioTooLow = availableMaxPartialCloseRatio < 2

          const isPartialCloseRatioTooGreat = !new BigNumber(this.bloc.partialCloseRatio$.value).lt(availableMaxPartialCloseRatio)

          const _partialClosePositionAvailable = this.bloc.partialCloseRatio$.value != 0
            && isDebtSizeValid
            && !isPartialCloseRatioTooGreat
            && !isImpossiblePartialCloseRatio
            && !isYouMustRepayMoreSituation
            && !isAvailablePartialCloseRatioTooLow
            && !isDebtTooLow

          this.bloc.repayPercentageLimit$.next(repayPercentageLimit)

          this.bloc.partialCloseAvailable$.next({
            status: _partialClosePositionAvailable,
            reason: this.getErrorReason({
              isDebtSizeValid,
              isImpossiblePartialCloseRatio,
              isYouMustRepayMoreSituation,
              availableMaxPartialCloseRatio,
              isPartialCloseRatioTooGreat,
              neededRepayAmount,
              neededRepayAmountInGaugeRatio,
              isAvailablePartialCloseRatioTooLow,
              minDebtSizeParsed,
              isDebtTooLow,
            }),
          })
        })
      })
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe()
  }

  componentWillUnmount() {
    this.destroy$.next(true)
  }

  // isKLAYRelatedPool = () => {
  //   const { baseToken, farmingToken } = this.props
  //   // @HOTFIX
  //   return isSameAddress(baseToken.address, tokenList.KLAY.address) || isSameAddress(farmingToken.address, tokenList.KLAY.address)
  // }

  getErrorReason = ({
    isDebtSizeValid,
    isImpossiblePartialCloseRatio,
    isYouMustRepayMoreSituation,
    isAvailablePartialCloseRatioTooLow,
    isDebtTooLow,
    isPartialCloseRatioTooGreat,

    availableMaxPartialCloseRatio,
    neededRepayAmount,
    neededRepayAmountInGaugeRatio,
    minDebtSizeParsed,
  }) => {

    if (isAvailablePartialCloseRatioTooLow || isDebtTooLow) {
      return `You can't close this position partially. Please use "Entirely Close" instead.`
    }

    if (!isDebtSizeValid) {
      return `Your updated Debt Value is less than the minimum required debt which is ${minDebtSizeParsed} ${this.props.baseToken.title}.` // invalid debt
    }

    if (isPartialCloseRatioTooGreat || isImpossiblePartialCloseRatio) {
      return `You can't close the position with that ratio. It must be less than ${Number(availableMaxPartialCloseRatio).toLocaleString('en-us', { maximumFractionDigits: 2 })}%`
    }

    if (isYouMustRepayMoreSituation) {
      return `You must repay enough debt to lower your position's Debt Ratio below the maximum allowed when partially closing a position on this pool. In this case, you must repay ${neededRepayAmount} ${this.props.baseToken.title} (~${neededRepayAmountInGaugeRatio}%) of the closed amount.`
    }

    return null
  }

  renderEntireSummary = () => {
    const { farmingToken, baseToken, tokenPrices, workerInfo, positionId } = this.props
    const lpToken = this.bloc.lpToken$.value
    const poolInfo = klayswapPoolInfo$.value[lpToken && lpToken.address.toLowerCase()]
    const isBaseTokenKLAY = isSameAddress(baseToken.address, tokenList.KLAY.address)

    switch (this.bloc.closingMethod$.value) {
      case 'minimizeTrading':
        return !!this.bloc.positionValue$.value && (
          <MinimizeTradingSummary

            workerAddress={workerInfo?.workerAddress}
            positionId={positionId}

            isBaseTokenKLAY={isBaseTokenKLAY}

            listenedAmountToTrade$={this.bloc.listenedAmountToTrade$}

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

            workerAddress={workerInfo?.workerAddress}
            positionId={positionId}

            isBaseTokenKLAY={isBaseTokenKLAY}

            listenedOutputAmount$={this.bloc.listenedOutputAmount$}

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

  getCloseMethodList = () => {
    const { baseToken, farmingToken } = this.props
    // When Minimize Trading Disabled:
    // Debt Token - user base token amount > 0
    // (user farming base token amount < Debt Token)

    const isBaseTokenKLAY = isSameAddress(baseToken.address, tokenList.KLAY.address)
    const baseTokenTitle = isBaseTokenKLAY
      ? "WKLAY"
      : baseToken.title

    // @HOTFIX: If partial close, and the farm is related to KLAY,
    // Don't allow 'minimizeTrading'
    // if (!this.bloc.entirelyClose$.value && this.isKLAYRelatedPool()) {
    //   return [
    //     { title: `Convert to ${baseTokenTitle}`, value: "convertToBaseToken" },
    //   ]
    // }


    return [
      { title: "Minimize Trading", value: "minimizeTrading" },
      { title: `Convert to ${baseTokenTitle}`, value: "convertToBaseToken" },
    ]
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
      workerInfo,
      positionId,
    } = this.props

    const {
      before_totalAPR,
      before_debtRatio,
      before_safetyBuffer,
      after_debtRatio,
      after_safetyBuffer,
      after_yieldFarmingAPR,
      after_tradingFeeAPR,
      after_klevaRewardsAPR,
      after_borrowingInterestAPR,
      after_totalAPR,
    } = this.bloc.getBeforeAfterValues({
      yieldFarmingAPRBefore,
      tradingFeeAPRBefore,
      klevaRewardsAPRBefore,
      borrowingInterestAPRBefore,
    })

    const isBaseTokenKLAY = isSameAddress(baseToken.address, tokenList.KLAY.address)

    return (
      <div className="ClosePositionPopup">
        <Modal className="ClosePositionPopup__modal" title={title}>
          <div className="ClosePositionPopup">
            <p className="ClosePositionPopup__methodSelectTitle">Closing Method</p>
            <RadioSet
              className="ClosePositionPopup__radioSet"
              selectedValue={this.bloc.closingMethod$.value}
              list={this.getCloseMethodList()}
              setChange={(v) => this.bloc.closingMethod$.next(v)}
            />
            {this.bloc.entirelyClose$.value
              ? this.renderEntireSummary()
              : <PartialController

                isBaseTokenKLAY={isBaseTokenKLAY}

                closingMethod={this.bloc.closingMethod$.value}
                repayPercentageLimit={this.bloc.repayPercentageLimit$.value}
                farmingToken={farmingToken}
                baseToken={baseToken}
                userFarmingTokenAmount={this.bloc.userFarmingTokenAmount$.value}
                userBaseTokenAmount={this.bloc.userBaseTokenAmount$.value}
                debtValue={this.bloc.debtValue$.value}
                debtRepaymentAmount$={this.bloc.debtRepaymentAmount$}
                partialCloseRatio$={this.bloc.partialCloseRatio$}
                repayDebtRatio$={this.bloc.repayDebtRatio$}
              />
            }
          </div>
          {!this.bloc.entirelyClose$.value && (
            <PartialClosePositionPopupSummary

              isBaseTokenKLAY={isBaseTokenKLAY}

              lpAmount={this.bloc.lpAmount$.value}
              debtRepaymentAmount$={this.bloc.debtRepaymentAmount$}

              workerInfo={workerInfo}
              positionId={positionId}
              closingMethod$={this.bloc.closingMethod$}
              partialCloseRatio$={this.bloc.partialCloseRatio$}
              repayDebtRatio$={this.bloc.repayDebtRatio$}

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
              debtValueAfter={new BigNumber(this.bloc.newDebtValue$.value).div(10 ** baseToken.decimals).toNumber()}

              debtRatioBefore={before_debtRatio}
              debtRatioAfter={after_debtRatio}
            />
          )}
          <div className="ClosePositionPopup__checkboxWrapper">
            <Checkbox
              className="ClosePositionPopup__checkbox"
              label="Entirely Close"
              checked$={this.bloc.entirelyClose$}
            />
          </div>
          {this.bloc.partialCloseAvailable$.value?.reason && (
            <p className="ClosePositionPopup__warn">
              {this.bloc.partialCloseAvailable$.value?.reason}
            </p>
          )}
          <button
            onClick={() => {
              if (!this.bloc.entirelyClose$.value && !(this.bloc.partialCloseAvailable$.value?.status)) return
              // if (!this.bloc.entirelyClose$.value && !this.bloc.partialCloseAvailable$.value?.status) return

              openLayeredModal$.next({
                component: (
                  <AreYouSureFarming
                    theme="warn"
                    onCancel={() => closeLayeredModal$.next(true)}
                    onClick={() => this.bloc.closePosition()}
                    message={(
                      <>
                        Please make sure you have read the details of <strong>Price Impact</strong> before taking further actions.
                      </>
                    )}
                    proceedButtonTitle={`Close Position`}
                  />
                )
              })
            }}
            className={cx("ClosePositionPopup__closePositionButton", {
              "ClosePositionPopup__closePositionButton--disabled": !this.bloc.entirelyClose$.value && !(this.bloc.partialCloseAvailable$.value?.status),
            })}
          >
            {this.bloc.isLoading$.value ? "..." : "Close Position"}
          </button>
        </Modal>
      </div>
    )
  }
}

export default ClosePositionPopup