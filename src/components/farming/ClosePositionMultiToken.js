import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of, forkJoin, BehaviorSubject } from 'rxjs'
import { takeUntil, tap, debounceTime, distinctUntilChanged, switchMap, pairwise, concatMap } from 'rxjs/operators'

import Bloc from './ClosePositionMultiToken.bloc'
import './ClosePositionMultiToken.scss'
import ModalHeader from '../modals/ModalHeader'
import { getBufferedWorkFactorBps, getEachTokenBasedOnLPShare, toAPY } from '../../utils/calc'
import { I18n } from '../common/I18n'
import SupplyInput from '../common/SupplyInput'
import LabelAndValue from '../LabelAndValue'
import { balancesInWallet$, selectedAddress$ } from '../../streams/wallet'
import QuestionMark from '../common/QuestionMark'
import { closeContentView$, closeModal$, openModal$ } from '../../streams/ui'
import FarmAPRDetailInfo2 from '../modals/FarmAPRDetailInfo2'
import LeverageInput from '../common/LeverageInput'
import BorrowingItem from './BorrowingItem'
import TokenRatio from './TokenRatio'
import PriceImpact from './PriceImpact'
import SlippageSetting from './SlippageSetting'
import { slippage$ } from '../../streams/setting'
import { addressKeyFind, nFormatter, noRounding } from '../../utils/misc'
import { checkAllowances$, getDebtRepaymentRange$, getDebtRepaymentRange_kokonut$, getLpAmounts$, getLpAmounts_kokonut$, getLpIngridients$, getPositionInfo$, getPositionInfo_single$ } from '../../streams/contract'
import { getIbTokenFromOriginalToken, isKLAY, tokenList } from '../../constants/tokens'
import WKLAYSwitcher from '../common/WKLAYSwitcher'
import Tabs from '../common/Tabs'
import BeforeAfter from '../BeforeAfter'
import ThickHR from '../common/ThickHR'
import RadioSet2 from '../common/RadioSet2'
import PartialController from '../PartialController'
import { klayswapPoolInfo$ } from '../../streams/farming'
import CompletedModal from '../common/CompletedModal'

class ClosePositionMultiToken extends Component {
  destroy$ = new Subject()

  bloc = new Bloc(this)

  componentDidMount() {

    const { 
      token1,
      token2,
      token3,
      token4,

      lpShare,
      totalShare,
      totalStakedLpBalance,
    } = this.props

    forkJoin(
      getLpAmounts_kokonut$({
        workerAddress: this.props.workerInfo.workerAddress,
        positionId: this.props.positionId,
      })
    ).subscribe((
      [
        { balance, share }
      ]) => {

      this.bloc.lpAmount$.next(balance)
      this.bloc.lpShare$.next(share)
    })

    merge(
      balancesInWallet$,
      klayswapPoolInfo$,
      merge(
        this.bloc.before_farmingAmount$,
        this.bloc.before_baseAmount$,
        this.bloc.baseTokenAmount$,
        this.bloc.leverage$,
      ),
      this.bloc.before_positionValue$,
      this.bloc.before_health$,
      this.bloc.before_debtAmount$,
      this.bloc.leverage$,
      this.bloc.lpChangeRatio$,

      this.bloc.isLoading$,
      this.bloc.baseToken$,
      this.bloc.positionValue$,
      this.bloc.borrowingAsset$,
      this.bloc.newDebtValue$,
      this.bloc.addCollateralAvailable$,
      this.bloc.isDebtSizeValid$,
      this.bloc.borrowMoreAvailable$,
      this.bloc.closingMethod$.pipe(
        tap(() => {
          this.bloc.getCloseResult()
        })
      ),
      this.bloc.debtRepaymentAmount$,
      this.bloc.repayPercentageLimit$,
      this.bloc.receiveBaseTokenAmt$,
      this.bloc.updatedPositionValue$,
      this.bloc.updatedHealth$,
      this.bloc.updatedDebtAmt$,
      this.bloc.lpAmount$,
      this.bloc.lpShare$,
      this.bloc.newUserLpAmount$,
      this.bloc.minPartialCloseRatio$,
      this.bloc.maxPartialCloseRatio$,
      this.bloc.minRepaymentDebtRatio$,
      this.bloc.maxRepaymentDebtRatio$,
      merge(
        this.bloc.entirelyClose$,
        this.bloc.partialCloseRatio$,
        this.bloc.repayDebtRatio$,
      ).pipe(
        debounceTime(100),
        tap(() => {

          const uniqueID = `${this.bloc.partialCloseRatio$.value}-${this.bloc.minRepaymentDebtRatio$.value}`
          this.bloc.dirty$.next(uniqueID)
        }),
        tap(() => {

          const closedLpAmt = new BigNumber(this.bloc.lpAmount$.value || 0)
            .multipliedBy(this.bloc.partialCloseRatio$.value || 0)
            .div(100)
            .toFixed(0)

          return getDebtRepaymentRange_kokonut$({
            workerAddress: this.props.workerInfo.workerAddress,
            positionId: this.props.positionId,
            closedLpAmt,
          }).subscribe(({
            closedPositionValue,
            closedHealth,
            minDebtRepayment,
            maxDebtRepayment,
          }) => {

            this.bloc.minRepaymentDebtRatio$.next(closedPositionValue == 0
              ? 0
              : ((minDebtRepayment / closedPositionValue) * 100) * 1.01 // +1% buffer
            )
            this.bloc.maxRepaymentDebtRatio$.next(closedPositionValue == 0
              ? 0
              : ((maxDebtRepayment / closedPositionValue) * 100) * 0.99 // -1% buffer
            )


            // dirty check to prevent infinite loop

            const uniqueID = `${this.bloc.partialCloseRatio$.value}-${this.bloc.minRepaymentDebtRatio$.value}`
            if (this.bloc.dirty$.value != uniqueID) {
              this.bloc.repayDebtRatio$.next(this.bloc.minRepaymentDebtRatio$.value)
            }

            const newPositionValue = new BigNumber(this.bloc.before_positionValue$.value)
              .minus(closedPositionValue)
              .toString()

            const newHealth = new BigNumber(this.bloc.before_health$.value)
              .minus(closedHealth)
              .toString()

            const debtRepayment = new BigNumber(closedPositionValue)
              .multipliedBy(this.bloc.repayDebtRatio$.value / 100)
              .toString()

            const newDebtValue = new BigNumber(this.bloc.before_debtAmount$.value)
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

            const newLpShare = new BigNumber(this.bloc.lpShare$.value)
              .multipliedBy((100 - this.bloc.partialCloseRatio$.value))
              .div(100)
              .toFixed(0)

            const decreasedLpShare = new BigNumber(this.bloc.lpShare$.value)
              .multipliedBy(this.bloc.partialCloseRatio$.value)
              .div(100)
              .toString()

            const closedLpAmt = new BigNumber(this.bloc.lpAmount$.value || 0)
              .multipliedBy(this.bloc.partialCloseRatio$.value || 0)
              .div(100)
              .toFixed(0)

            const lpPortion = new BigNumber(newLpShare)
              .div(new BigNumber(totalShare).minus(decreasedLpShare))
              .toNumber()

            const newLpAmount = new BigNumber(totalStakedLpBalance)
              .minus(closedLpAmt)
              .multipliedBy(lpPortion)
              .toFixed(0)

            this.bloc.newUserLpAmount$.next(newLpAmount)

            const { rawKillFactorBps, workFactorBps } = this.bloc.getConfig()

            const bufferedWorkFactorBps = getBufferedWorkFactorBps(workFactorBps)

            const ibToken = getIbTokenFromOriginalToken(this.props.baseToken)

            const a1 = new BigNumber(newHealth).multipliedBy(bufferedWorkFactorBps).toString()
            const a2 = new BigNumber(newDebtValue).multipliedBy(10 ** 4).toString()

            const isDebtSizeValid = newDebtValue == 0 || new BigNumber(newDebtValue).gte(ibToken?.minDebtSize)
            this.bloc.isDebtSizeValid$.next(isDebtSizeValid)

            const minDebtSizeParsed = new BigNumber(ibToken?.minDebtSize).div(10 ** ibToken?.decimals).toString()

            const debtValue = this.bloc.before_debtAmount$.value

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
                  .div(new BigNumber(this.bloc.before_health$.value).multipliedBy(bufferedWorkFactorBps))
              )
              .multipliedBy(100)
              .multipliedBy(0.99) // 1% buffer
              .toString()

            this.bloc.maxPartialCloseRatio$.next(availableMaxPartialCloseRatio)

            // Impossible Partial Close Ratio Situation
            // 1) repay debt ratio should be A,
            // 2) But when the ratio becomes A, the position can't meet min debt size criteria.
            // So in this case, you can't execute 'partial close'.
            const isImpossiblePartialCloseRatio = new BigNumber(debtValue).minus(
              new BigNumber(neededRepayAmount).multipliedBy(10 ** this.props.baseToken?.decimals)
            ).lt(ibToken?.minDebtSize)

            const isDebtTooLow = new BigNumber(debtValue).lte(ibToken?.minDebtSize)

            // const isYouMustRepayMoreSituation = (neededRepayAmount != 0) && !(new BigNumber(a1).isGreaterThan(a2))
            const isYouMustRepayMoreSituation = new BigNumber(debtRepayment).lt(minDebtRepayment)

            const isAvailablePartialCloseRatioTooLow = availableMaxPartialCloseRatio < 2

            const isPartialCloseRatioTooGreat = new BigNumber(this.bloc.partialCloseRatio$.value).gt(availableMaxPartialCloseRatio)

            const _partialClosePositionMultiTokenAvailable = this.bloc.partialCloseRatio$.value != 0
              && isDebtSizeValid
              && !isPartialCloseRatioTooGreat
              && !isImpossiblePartialCloseRatio
              && !isYouMustRepayMoreSituation
              && !isAvailablePartialCloseRatioTooLow
              && !isDebtTooLow

            this.bloc.repayPercentageLimit$.next(repayPercentageLimit)

            this.bloc.partialCloseAvailable$.next({
              status: _partialClosePositionMultiTokenAvailable,
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

            this.bloc.getCloseResult()
          })
        })
      )
    ).pipe(
      debounceTime(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })
  }

  componentWillUnmount() {
    this.destroy$.next(true)
  }

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

  renderButtons = () => {
    const ibToken = getIbTokenFromOriginalToken(this.props.baseToken)

    const isDisabled = this.bloc.entirelyClose$.value
      ? false
      : !this.bloc.partialCloseAvailable$.value?.status

    return (
      <>
        {!this.bloc.isDebtSizeValid$.value && (
          <p className="ClosePositionMultiToken__minDebtSize">
            {I18n.t('farming.error.minDebtSize', {
              minDebt: `${nFormatter(new BigNumber(ibToken.minDebtSize).div(10 ** ibToken.decimals).toNumber(), 2)} ${this.bloc.borrowingAsset$.value?.title}`
            })}
          </p>
        )}
        <div className="ClosePositionMultiToken__buttons">
          <button onClick={() => closeContentView$.next(true)} className="ClosePositionMultiToken__cancelButton">
            {I18n.t('cancel')}
          </button>
          <button
            onClick={() => {
              if (isDisabled) return
              this.bloc.closePosition()
            }}
            className={cx("ClosePositionMultiToken__button", {
              "ClosePositionMultiToken__button--disabled": isDisabled,
            })}
          >
            {this.bloc.isLoading$.value
              ? "..."
              : I18n.t('myasset.withdraw')
            }
          </button>
        </div>
      </>
    )
  }

  render() {
    const {
      title,
      defaultLeverage,
      yieldFarmingAPR,
      tradingFeeAPR,
      klevaRewardAPR,
      borrowingInterestAPRBefore,
      workerInfo,

      token1,
      token2,
      token3,
      token4,
      baseToken,

      lpToken,
      selectedAddress,

      offset,
      setLeverage,

      baseBorrowingInterests,

      currentPositionLeverage,
      baseBorrowingInterestAPR,
    } = this.props

    // config
    const { leverageCap } = this.bloc.getConfig()

    const {
      before_totalAPR,
      after_totalAPR,
      before_safetyBuffer,
      after_debtRatio,
      after_safetyBuffer,
      after_yieldFarmingAPR,
      after_tradingFeeAPR,
      after_klevaRewardsAPR,
      after_borrowingInterestAPR,
    } = this.bloc.getBeforeAfterValues({
      yieldFarmingAPRBefore: yieldFarmingAPR,
      tradingFeeAPRBefore: tradingFeeAPR,
      klevaRewardsAPRBefore: klevaRewardAPR,
      borrowingInterestAPRBefore,
    })

    const before_apy = toAPY(before_totalAPR)
    const apy = toAPY(after_totalAPR)

    const resultDebtAmount = new BigNumber(this.bloc.newDebtValue$.value)
      .div(10 ** baseToken.decimals)
      .toNumber()

    // const equityBaseAmount = new BigNumber(this.bloc.before_baseAmount$.value || 0)
    //   .div(10 ** baseToken.decimals)
    //   .multipliedBy(100 - this.bloc.partialCloseRatio$.value)
    //   .div(100)
    //   .minus(resultDebtAmount)
    //   .toNumber()

    // debt ratio
    const before_debtRatio = new BigNumber(this.bloc.before_debtAmount$.value)
      .div(this.bloc.before_positionValue$.value)
      .multipliedBy(100)
      .toNumber()

    const debtRatio = new BigNumber(this.bloc.newDebtValue$.value)
      .div(this.bloc.newPositionValue$.value)
      .multipliedBy(100)
      .toNumber()

    let debtDelta = new BigNumber(resultDebtAmount)
      .minus(new BigNumber(this.bloc.before_debtAmount$.value).div(10 ** baseToken.decimals))
      .toNumber()

    debtDelta = debtDelta > 0.1
      ? debtDelta
      : 0

    return (
      <div className="ClosePositionMultiToken">
        <div className="ClosePositionMultiToken__content">
          <div className="ClosePositionMultiToken__left">
            <ModalHeader
              title={I18n.t('withdraw')}
            />
            <Tabs
              className="ClosePositionMultiToken__tabs"
              list={[
                {
                  title: I18n.t('farming.closePosition.entireClose'),
                  onClick: () => this.bloc.entirelyClose$.next(true),
                  isActive: this.bloc.entirelyClose$.value,
                },
                {
                  title: I18n.t('farming.closePosition.partialClose'),
                  onClick: () => {
                    if (currentPositionLeverage == 1) {

                      openModal$.next({
                        component: <CompletedModal menus={[
                          {
                            title: I18n.t('confirm'),
                            onClick: () => {
                              closeModal$.next(true)
                            }
                          },
                        ]}>
                          <p className="CompletedModal__title">{I18n.t('farming.closePosition.partialClose.disabled')}</p>
                          <p className="CompletedModal__description">{I18n.t('farming.closePosition.partialClose.disabled.description')}</p>
                        </CompletedModal>
                      })
                      return
                    }
                    this.bloc.entirelyClose$.next(false)
                  },
                  isActive: !this.bloc.entirelyClose$.value,
                }
              ]}
            />

            {this.bloc.entirelyClose$.value
              ? (
                <>
                  <div className="ClosePositionMultiToken__entireCloseHeader">
                    <LabelAndValue
                      label={I18n.t('farming.summary.totalDeposit')}
                      value={(
                        <>
                          <p>
                            {noRounding(
                              new BigNumber(this.bloc.lpAmount$.value)
                                .div(10 ** lpToken.decimals)
                                .toNumber(),
                              4
                            )} {lpToken.title}
                          </p>
                        </>
                      )}
                    />
                    <LabelAndValue
                      label={I18n.t('farming.closePosition.debtRepay')}
                      value={`${noRounding(
                        new BigNumber(this.bloc.before_debtAmount$.value)
                          .div(10 ** baseToken.decimals)
                          .toNumber(),
                        4)} ${baseToken.title}`}
                    />
                  </div>
                </>
              )
              : (
                <>
                  <PartialController
                    farmingToken={{
                      ...lpToken,
                      title: lpToken.title
                    }}
                    baseToken={{
                      ...baseToken,
                      title: baseToken.title
                    }}
                    multiToken
                    userFarmingTokenAmount={new BigNumber(this.bloc.lpAmount$.value).div(10 ** lpToken.decimals).toNumber()}
                    userBaseTokenAmount={new BigNumber(this.bloc.before_baseAmount$.value).div(10 ** baseToken.decimals).toNumber()}
                    partialCloseRatio$={this.bloc.partialCloseRatio$}
                    repayDebtRatio$={this.bloc.repayDebtRatio$}
                    debtRepaymentAmount$={this.bloc.debtRepaymentAmount$}
                    repayPercentageLimit={this.bloc.repayPercentageLimit$.value}
                    minPartialCloseRatio$={this.bloc.minPartialCloseRatio$}
                    maxPartialCloseRatio$={this.bloc.maxPartialCloseRatio$}
                    minRepaymentDebtRatio$={this.bloc.minRepaymentDebtRatio$}
                    maxRepaymentDebtRatio$={this.bloc.maxRepaymentDebtRatio$}
                  />
                  <div className="ClosePositionMultiToken__remainInfo">
                    <p className="ClosePositionMultiToken__remainInfoTitle">{I18n.t('farming.closePosition.remainedAsset')}</p>
                    <LabelAndValue
                      className="ClosePositionMultiToken__totalDeposit"
                      label={I18n.t('farming.summary.totalDeposit')}
                      value={(
                        <>
                          <p>
                            {noRounding(
                              new BigNumber(this.bloc.newUserLpAmount$.value)
                                .div(10 ** lpToken.decimals)
                                .toNumber(),
                              4
                            )} {lpToken.title}
                          </p>
                        </>
                      )}
                    />
                    {/* <LabelAndValue
                      className="ClosePositionMultiToken__equity"
                      label={(
                        <>
                          <p>{I18n.t('myasset.farming.equityValue.partialClose')}</p>
                        </>
                      )}
                      value={(
                        <>
                          <p>{nFormatter(new BigNumber(this.bloc.lpAmount$.value).div(10 ** lpToken.decimals))} {lpToken.title}</p>
                        </>
                      )}
                    /> */}
                    <LabelAndValue
                      className="ClosePositionMultiToken__debt"
                      label={I18n.t('farming.summary.debt')}
                      value={`${nFormatter(new BigNumber(this.bloc.newDebtValue$.value).div(10 ** baseToken.decimals).toNumber())} ${baseToken.title}`}
                    />
                    <LabelAndValue
                      className="ClosePositionMultiToken__debtRatio"
                      label={I18n.t('myasset.farming.debtRatio')}
                      value={(
                        <>
                          <BeforeAfter
                            before={`${before_debtRatio.toFixed(2)}%`}
                            after={`${debtRatio.toFixed(2)}%`}
                          />
                        </>
                      )}
                    />
                    <LabelAndValue
                      className="ClosePositionMultiToken__apy"
                      label={I18n.t('apy')}
                      value={(
                        <BeforeAfter
                          before={`${Number(before_apy).toLocaleString('en-us', { maximumFractionDigits: 2 })}%`}
                          after={(
                            <>
                              {`${Number(apy).toLocaleString('en-us', { maximumFractionDigits: 2 })}%`}
                              <QuestionMark
                                info
                                color="#265FFC"
                                onClick={() => {
                                  openModal$.next({
                                    component: (
                                      <FarmAPRDetailInfo2
                                        title={`${lpToken.title}`}
                                        selectedAddress={selectedAddress}
                                        yieldFarmingAPR={after_yieldFarmingAPR}
                                        klevaRewardAPR={after_klevaRewardsAPR}
                                        tradingFeeAPR={after_tradingFeeAPR}
                                        borrowingInterest={after_borrowingInterestAPR}
                                        apr={after_totalAPR}
                                        apy={apy}
                                      />
                                    )
                                  })
                                }}
                              />
                            </>
                          )}
                        />
                      )}
                    />
                  </div>
                </>
              )
            }
          </div>
          <ThickHR />
          <div className="ClosePositionMultiToken__right">

            <div className="ClosePositionMultiToken__summary">
              <div className="ClosePositionMultiToken__willBeWithdrawn">
                <p className="ClosePositionMultiToken__willBeWithdrawnTitle">{I18n.t('willBeWithdrawnBy', { title: isKLAY(baseToken.address) ? "WKLAY" : baseToken.title })}</p>
                <p className="ClosePositionMultiToken__willBeWithdrawnDescription">{I18n.t('willBeWithdrawnBy.description')}</p>
              </div>
              {/* <PriceImpact
                title={I18n.t('lossByTokenRatio')}
                description={I18n.t('lpImpact')}
                priceImpact={this.bloc.lpChangeRatio$.value}
              />
              <SlippageSetting /> */}
              <LabelAndValue
                className="ClosePositionMultiToken__totalReceived"
                label={I18n.t('totalReceivedAsset')}
                value={(
                  <>
                    <p>{noRounding(new BigNumber(this.bloc.receiveBaseTokenAmt$.value || 0).div(10 ** baseToken.decimals).toNumber(), 4)} {isKLAY(baseToken.address) ? "WKLAY" : baseToken.title}</p>
                  </>
                )}
              />
            </div>
          </div>
        </div>
        <div className="ClosePositionMultiToken__footer">
          {this.renderButtons()}
        </div>
      </div>
    )
  }
}

export default ClosePositionMultiToken