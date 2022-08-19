import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of, forkJoin, BehaviorSubject } from 'rxjs'
import { takeUntil, tap, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators'

import Bloc from './ClosePosition.bloc'
import './ClosePosition.scss'
import ModalHeader from '../modals/ModalHeader'
import { getBufferedWorkFactorBps, getEachTokenBasedOnLPShare, toAPY } from '../../utils/calc'
import { I18n } from '../common/I18n'
import SupplyInput from '../common/SupplyInput'
import LabelAndValue from '../LabelAndValue'
import { balancesInWallet$, selectedAddress$ } from '../../streams/wallet'
import QuestionMark from '../common/QuestionMark'
import { closeContentView$, openModal$ } from '../../streams/ui'
import FarmAPRDetailInfo2 from '../modals/FarmAPRDetailInfo2'
import LeverageInput from '../common/LeverageInput'
import BorrowingItem from './BorrowingItem'
import TokenRatio from './TokenRatio'
import PriceImpact from './PriceImpact'
import SlippageSetting from './SlippageSetting'
import { slippage$ } from '../../streams/setting'
import { addressKeyFind, nFormatter, noRounding } from '../../utils/misc'
import { checkAllowances$, getDebtRepaymentRange$, getLpAmounts$, getLpIngridients$, getPositionInfo$, getPositionInfo_single$ } from '../../streams/contract'
import { getIbTokenFromOriginalToken, isKLAY, tokenList } from '../../constants/tokens'
import WKLAYSwitcher from '../common/WKLAYSwitcher'
import Tabs from '../common/Tabs'
import BeforeAfter from '../BeforeAfter'
import ThickHR from '../common/ThickHR'
import RadioSet2 from '../common/RadioSet2'
import PartialController from '../PartialController'
import { klayswapPoolInfo$ } from '../../streams/farming'

class ClosePosition extends Component {
  destroy$ = new Subject()

  bloc = new Bloc(this)

  componentDidMount() {

    forkJoin(
      getLpIngridients$({
        workerAddress: this.props.workerInfo.workerAddress,
        positionId: this.props.positionId,
      }),
      getPositionInfo_single$({
        workerAddress: this.props.workerInfo.workerAddress,
        positionId: this.props.positionId,
      }),
      getLpAmounts$({
        workerAddress: this.props.workerInfo.workerAddress,
        positionId: this.props.positionId,
      })
    ).subscribe((
        [
          { baseAmt, farmAmt }, 
          { positionValue, health, debtAmt },
          { balance, share }
      ]) => {
      this.bloc.before_farmingAmount$.next(farmAmt)
      this.bloc.before_baseAmount$.next(baseAmt)
      this.bloc.before_positionValue$.next(positionValue)
      this.bloc.before_health$.next(health)
      this.bloc.before_debtAmount$.next(debtAmt)

      this.bloc.before_equityValue$.next(new BigNumber(positionValue).minus(debtAmt).toString())

      this.bloc.lpAmount$.next(balance)
      this.bloc.lpShare$.next(share)
    })

    merge(
      balancesInWallet$,
      klayswapPoolInfo$,
      merge(
        this.bloc.before_farmingAmount$,
        this.bloc.before_baseAmount$,

        this.bloc.farmingTokenAmount$,
        this.bloc.baseTokenAmount$,
        this.bloc.leverage$,
        this.bloc.borrowMore$.pipe(
          distinctUntilChanged(),
        ),
      ).pipe(
        switchMap(() => this.bloc.getOpenPositionResult$()),
        tap(() => {

          const { baseToken } = this.props

          const newPositionValue = this.bloc.positionValue$.value
          const { rawKillFactorBps, workFactorBps } = this.bloc.getConfig()

          // Check add collateral available

          const _addCollateralAvailable = new BigNumber(newPositionValue)
            .multipliedBy(rawKillFactorBps)
            .gte(new BigNumber(this.bloc.before_debtAmount$.value).multipliedBy(10 ** 4))

          this.bloc.addCollateralAvailable$.next(_addCollateralAvailable)

          const amountToBeBorrowed = this.bloc.getAmountToBorrow()

          console.log(this.bloc.before_debtAmount$.value, 'this.bloc.before_debtAmount$.value')
          console.log(amountToBeBorrowed, 'amountToBeBorrowed')

          const newDebtValue = new BigNumber(this.bloc.before_debtAmount$.value)
            .plus(amountToBeBorrowed)
            .toString()

          this.bloc.newDebtValue$.next(newDebtValue)

          // Check borrow more valid
          const ibToken = getIbTokenFromOriginalToken(baseToken)
          const isDebtSizeValid = newDebtValue == 0 || new BigNumber(newDebtValue).gte(ibToken?.minDebtSize)

          this.bloc.isDebtSizeValid$.next(isDebtSizeValid)

          const a1 = new BigNumber(newPositionValue).multipliedBy(workFactorBps).toString()
          const a2 = new BigNumber(newDebtValue).multipliedBy(10 ** 4).toString()

          const _borrowMoreAvailable = new BigNumber(a1).isGreaterThan(a2)

          this.bloc.borrowMoreAvailable$.next(isDebtSizeValid && _borrowMoreAvailable)
        })
      ),

      this.bloc.before_positionValue$,
      this.bloc.before_health$,
      this.bloc.before_debtAmount$,
      this.bloc.leverage$,

      this.bloc.isLoading$,
      this.bloc.baseToken$,
      this.bloc.farmingToken$,
      this.bloc.positionValue$,
      this.bloc.resultBaseTokenAmount$,
      this.bloc.resultFarmTokenAmount$,
      this.bloc.leverageImpact$,
      this.bloc.priceImpact$,
      this.bloc.borrowingAsset$,
      this.bloc.newDebtValue$,
      this.bloc.addCollateralAvailable$,
      this.bloc.isDebtSizeValid$,
      this.bloc.borrowMoreAvailable$,
      this.bloc.closingMethod$.pipe(
        tap(() => {
          console.log('get result!')
          this.bloc.getCloseResult()
        })
      ),
      this.bloc.debtRepaymentAmount$,
      this.bloc.repayPercentageLimit$,
      this.bloc.receiveBaseTokenAmt$,
      this.bloc.receiveFarmTokenAmt$,
      this.bloc.amountToTrade$,
      this.bloc.tokenOutAmount$,
      this.bloc.priceImpactBps$,
      this.bloc.priceImpactBpsWithoutFee$,
      this.bloc.updatedPositionValue$,
      this.bloc.updatedHealth$,
      this.bloc.updatedDebtAmt$,
      this.bloc.lpAmount$,
      this.bloc.lpShare$,
      this.bloc.newUserBaseTokenAmount$,
      this.bloc.newUserFarmingTokenAmount$,
      merge(
        this.bloc.entirelyClose$,
        this.bloc.partialCloseRatio$,
        this.bloc.repayDebtRatio$,
      ).pipe(
        tap(() => {
          this.bloc.getCloseResult()
        }),
        tap(() => {

          console.log(this.bloc.lpAmount$.value, 'this.bloc.lpAmount$.value')

          const closedLpAmt = new BigNumber(this.bloc.lpAmount$.value)
            .multipliedBy(this.bloc.partialCloseRatio$.value)
            .div(100)
            .toFixed(0)

          console.log(closedLpAmt, 'closedLpAmt')

          return getDebtRepaymentRange$({
            workerAddress: this.props.workerInfo.workerAddress,
            positionId: this.props.positionId,
            closedLpAmt,
          }).subscribe(({
            closedPositionValue,
            closedHealth,
            minDebtRepayment,
            maxDebtRepayment,
          }) => {

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

            const poolInfo = addressKeyFind(klayswapPoolInfo$.value, this.props.lpToken?.address)

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
              totalShare: this.props.totalShare,
              totalStakedLpBalance: this.props.totalStakedLpBalance,
            })
            
            this.bloc.newUserBaseTokenAmount$.next(newUserBaseTokenAmount)
            this.bloc.newUserFarmingTokenAmount$.next(newUserFarmingTokenAmount)

            const { rawKillFactorBps, workFactorBps } = this.bloc.getConfig()

            const bufferedWorkFactorBps = getBufferedWorkFactorBps(workFactorBps)

            const ibToken = getIbTokenFromOriginalToken(this.props.baseToken)

            const a1 = new BigNumber(newHealth).multipliedBy(bufferedWorkFactorBps).toString()
            const a2 = new BigNumber(newDebtValue).multipliedBy(10 ** 4).toString()

            const isDebtSizeValid = newDebtValue == 0 || new BigNumber(newDebtValue).gte(ibToken?.minDebtSize)

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
      )
    ).pipe(
      debounceTime(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })

    // Fetch farmingToken & baseToken allowances of the vault when worker changed.
    merge(
      this.bloc.fetchAllowances$,
      this.bloc.worker$,
    ).pipe(
      switchMap(() => {
        const worker = this.bloc.worker$.value
        return checkAllowances$(
          selectedAddress$.value,
          this.props.vaultAddress,
          [this.bloc.baseToken$.value, this.bloc.farmingToken$.value]
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
    const { farmingToken, baseToken, vaultAddress } = this.props

    const isDisabled = this.bloc.entirelyClose$.vaule 
      ? false
      : !this.bloc.partialCloseAvailable$.value?.status

    return (
      <>
        {!this.bloc.isDebtSizeValid$.value && (
          <p className="ClosePosition__minDebtSize">
            {I18n.t('farming.error.minDebtSize', {
              minDebt: `${nFormatter(new BigNumber(ibToken.minDebtSize).div(10 ** ibToken.decimals).toNumber(), 2)} ${this.bloc.borrowingAsset$.value?.title}`
            })}
          </p>
        )}
        <div className="ClosePosition__buttons">
          <button onClick={() => closeContentView$.next(true)} className="ClosePosition__cancelButton">
            {I18n.t('cancel')}
          </button>
          <button
            onClick={() => {
              if (isDisabled) return
              this.bloc.closePosition()
            }}
            className={cx("ClosePosition__button", {
              "ClosePosition__button--disabled": isDisabled,
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

  renderSupplyInput = ({ baseToken, farmingToken }) => {
    if (isKLAY(farmingToken.address)) {
      return (
        <>
          <SupplyInput
            decimalLimit={baseToken.decimals}
            value$={this.bloc.baseTokenAmount$}
            valueLimit={balancesInWallet$.value[baseToken.address] && balancesInWallet$.value[baseToken.address].balanceParsed}
            labelValue={balancesInWallet$.value[baseToken.address] && balancesInWallet$.value[baseToken.address].balanceParsed}
            imgSrc={baseToken.iconSrc}
            labelTitle={`${I18n.t('farming.controller.available')} ${baseToken.title}`}
            inputLabel={baseToken.title}
            targetToken={baseToken}
          />
          <SupplyInput
            decimalLimit={farmingToken.decimals}
            value$={this.bloc.farmingTokenAmount$}
            valueLimit={balancesInWallet$.value[tokenList.WKLAY.address] && balancesInWallet$.value[tokenList.WKLAY.address].balanceParsed}
            labelValue={balancesInWallet$.value[tokenList.WKLAY.address] && balancesInWallet$.value[tokenList.WKLAY.address].balanceParsed}
            imgSrc={farmingToken.iconSrc}
            labelTitle={`${I18n.t('farming.controller.converted')} ${tokenList.WKLAY.title}`}
            inputLabel={tokenList.WKLAY.title}
            targetToken={tokenList.WKLAY}
          />
          <WKLAYSwitcher balancesInWallet={balancesInWallet$.value} />
        </>
      )
    }

    if (isKLAY(baseToken.address)) {
      return (
        <>
          <SupplyInput
            decimalLimit={farmingToken.decimals}
            value$={this.bloc.farmingTokenAmount$}
            valueLimit={balancesInWallet$.value[farmingToken.address] && balancesInWallet$.value[farmingToken.address].balanceParsed}
            labelValue={balancesInWallet$.value[farmingToken.address] && balancesInWallet$.value[farmingToken.address].balanceParsed}
            imgSrc={farmingToken.iconSrc}
            labelTitle={`${I18n.t('farming.controller.available')} ${farmingToken.title}`}
            inputLabel={farmingToken.title}
            targetToken={farmingToken}
          />
          <SupplyInput
            decimalLimit={baseToken.decimals}
            value$={this.bloc.baseTokenAmount$}
            valueLimit={balancesInWallet$.value[tokenList.WKLAY.address] && balancesInWallet$.value[tokenList.WKLAY.address].balanceParsed}
            labelValue={balancesInWallet$.value[tokenList.WKLAY.address] && balancesInWallet$.value[tokenList.WKLAY.address].balanceParsed}
            imgSrc={tokenList.WKLAY.iconSrc}
            labelTitle={`${I18n.t('farming.controller.converted')} ${tokenList.WKLAY.title}`}
            inputLabel={tokenList.WKLAY.title}
            targetToken={tokenList.WKLAY}
          />
          <WKLAYSwitcher balancesInWallet={balancesInWallet$.value} />
        </>
      )
    }

    return (
      <>
        <SupplyInput
          decimalLimit={farmingToken.decimals}
          value$={this.bloc.farmingTokenAmount$}
          valueLimit={balancesInWallet$.value[farmingToken.address] && balancesInWallet$.value[farmingToken.address].balanceParsed}
          labelValue={balancesInWallet$.value[farmingToken.address] && balancesInWallet$.value[farmingToken.address].balanceParsed}
          imgSrc={farmingToken.iconSrc}
          labelTitle={`${I18n.t('farming.controller.available')} ${farmingToken.title}`}
          inputLabel={farmingToken.title}
          targetToken={farmingToken}
        />
        <SupplyInput
          decimalLimit={baseToken.decimals}
          value$={this.bloc.baseTokenAmount$}
          valueLimit={balancesInWallet$.value[baseToken.address] && balancesInWallet$.value[baseToken.address].balanceParsed}
          labelValue={balancesInWallet$.value[baseToken.address] && balancesInWallet$.value[baseToken.address].balanceParsed}
          imgSrc={baseToken.iconSrc}
          labelTitle={`${I18n.t('farming.controller.available')} ${baseToken.title}`}
          inputLabel={baseToken.title}
          targetToken={baseToken}
        />
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

      farmingToken,
      baseToken,

      lpToken,
      selectedAddress,

      offset,
      setLeverage,

      baseBorrowingInterests,
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

    const borrowingAmount = new BigNumber(this.bloc.getAmountToBorrow())
      .div(10 ** baseToken.decimals)
      .toNumber()

    const { value1, value2 } = this.bloc.getValueInUSD()

    const resultFarmingTokenAmount = new BigNumber(this.bloc.resultFarmTokenAmount$.value)
      .div(10 ** farmingToken.decimals)
      .toNumber()

    const resultBaseTokenAmount = new BigNumber(this.bloc.resultBaseTokenAmount$.value)
      .div(10 ** baseToken.decimals)
      .toNumber()

    const resultDebtAmount = new BigNumber(this.bloc.newDebtValue$.value)
      .div(10 ** baseToken.decimals)
      .toNumber()

    const equityFarmingAmount = new BigNumber(this.bloc.before_farmingAmount$.value || 0)
      .div(10 ** farmingToken.decimals)
      .multipliedBy(100 - this.bloc.partialCloseRatio$.value)
      .div(100)
      .toNumber()

    const equityBaseAmount = new BigNumber(this.bloc.before_baseAmount$.value || 0)
      .minus(this.bloc.before_debtAmount$.value)
      .div(10 ** baseToken.decimals)
      .multipliedBy(100 - this.bloc.partialCloseRatio$.value)
      .div(100)
      .toNumber()

    // debt ratio
    const before_debtRatio = new BigNumber(this.bloc.before_debtAmount$.value)
      .div(this.bloc.before_positionValue$.value)
      .multipliedBy(100)
      .toNumber()

    const debtRatio = new BigNumber(this.bloc.newDebtValue$.value)
      .div(this.bloc.positionValue$.value)
      .multipliedBy(100)
      .toNumber()

    let debtDelta = new BigNumber(resultDebtAmount)
      .minus(new BigNumber(this.bloc.before_debtAmount$.value).div(10 ** baseToken.decimals))
      .toNumber()

    debtDelta = debtDelta > 0.1
      ? debtDelta
      : 0

    // 
    const radioList = [
      {
        label: I18n.t('farming.closePosition.minimizeTrading'),
        value: ``,
        onClick: () => this.bloc.closingMethod$.next('minimizeTrading'),
      },
      {
        label: I18n.t('farming.closePosition.baseTokenOnly', { title: baseToken.title }),
        value: ``,
        onClick: () => this.bloc.closingMethod$.next('convertToBaseToken'),
      },
    ]

    const selectedLabel = this.bloc.closingMethod$.value === 'minimizeTrading' 
      ? I18n.t('farming.closePosition.minimizeTrading')
      : I18n.t('farming.closePosition.baseTokenOnly', { title: baseToken.title })

    return (
      <div className="ClosePosition">
        <div className="ClosePosition__content">
          <div className="ClosePosition__left">
            <ModalHeader
              title={I18n.t('withdraw')}
            />
            <Tabs
              className="ClosePosition__tabs"
              list={[
                {
                  title: I18n.t('farming.closePosition.entireClose'),
                  onClick: () => this.bloc.entirelyClose$.next(true),
                  isActive: this.bloc.entirelyClose$.value,
                },
                {
                  title: I18n.t('farming.closePosition.partialClose'),
                  onClick: () => this.bloc.entirelyClose$.next(false),
                  isActive: !this.bloc.entirelyClose$.value,
                }
              ]}
            />

            {this.bloc.entirelyClose$.value 
              ? (
                <>
                  <div className="ClosePosition__entireCloseHeader">
                    <LabelAndValue
                      label={I18n.t('farming.summary.totalDeposit')}
                      value={(
                        <>
                          <p>
                            {noRounding(
                              new BigNumber(this.bloc.before_farmingAmount$.value)
                                .div(10 ** farmingToken.decimals)
                                .toNumber(),
                              4
                            )} {farmingToken.title}
                          </p>
                          <p>
                            {noRounding(
                              new BigNumber(this.bloc.before_baseAmount$.value)
                                .div(10 ** baseToken.decimals)
                                .toNumber(),
                              4
                            )} {baseToken.title}
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
                    farmingToken={farmingToken}
                    baseToken={baseToken}
                    userFarmingTokenAmount={new BigNumber(this.bloc.before_farmingAmount$.value).div(10 ** farmingToken.decimals).toNumber()}
                    userBaseTokenAmount={new BigNumber(this.bloc.before_baseAmount$.value).div(10 ** baseToken.decimals).toNumber()}
                    partialCloseRatio$={this.bloc.partialCloseRatio$}
                    repayDebtRatio$={this.bloc.repayDebtRatio$}
                    debtRepaymentAmount$={this.bloc.debtRepaymentAmount$}
                    repayPercentageLimit={this.bloc.repayPercentageLimit$.value}
                  />
                  {this.bloc.partialCloseAvailable$.value?.reason && (
                    <p className="ClosePositionPopup__warn">
                      {this.bloc.partialCloseAvailable$.value?.reason}
                    </p>
                  )}

                  <div className="ClosePosition__remainInfo">
                    <p className="ClosePosition__remainInfoTitle">{I18n.t('farming.closePosition.remainedAsset')}</p>
                    <LabelAndValue
                      className="ClosePosition__totalDeposit"
                      label={I18n.t('farming.summary.totalDeposit')}
                      value={(
                        <>
                          <p>
                            {
                              noRounding(
                                new BigNumber(this.bloc.newUserFarmingTokenAmount$.value)
                                  .div(10 ** farmingToken.decimals)
                                  .toNumber(),
                                4
                              )
                            } {farmingToken.title}
                          </p>
                          <p>
                            {
                              noRounding(
                                new BigNumber(this.bloc.newUserBaseTokenAmount$.value)
                                  .div(10 ** baseToken.decimals)
                                  .toNumber(),
                                4
                              )
                            } {baseToken.title}
                          </p>
                        </>
                      )}
                    />
                    <LabelAndValue
                      className="ClosePosition__equity"
                      label={(
                        <>
                          <p>{I18n.t('myasset.farming.equityValue')}</p>
                        </>
                      )}
                      value={(
                        <>
                          <p>{nFormatter(equityFarmingAmount, 4)} {farmingToken.title}</p>
                          <p>{nFormatter(equityBaseAmount, 4)} {baseToken.title}</p>
                        </>
                      )}
                    />
                    <LabelAndValue
                      className="ClosePosition__debt"
                      label={I18n.t('farming.summary.debt')}
                      value={`${nFormatter(borrowingAmount, 4)} ${baseToken.title}`}
                    />
                    <LabelAndValue
                      className="ClosePosition__debtRatio"
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
                      className="ClosePosition__apy"
                      label={I18n.t('apy')}
                      value={(
                        <BeforeAfter 
                          before={`${Number(before_apy).toLocaleString('en-us', { maximumFractionDigits: 2 })}%`}
                          after={`${Number(apy).toLocaleString('en-us', { maximumFractionDigits: 2 })}%`}
                        />
                      )}
                    />
                  </div>
                </>
              )
            }
          </div>
          <ThickHR />
          <div className="ClosePosition__right">
            <RadioSet2
              className="ClosePosition__radioSet"
              selectedLabel={selectedLabel}
              list={radioList}
            />

            <div className="ClosePosition__summary">
              <LabelAndValue
                className="ClosePosition__tokenSwap"
                label={I18n.t('tokenswap')}
                value={`${
                  noRounding(
                    new BigNumber(this.bloc.amountToTrade$.value).div(10 ** farmingToken.decimals).toNumber(),
                    4
                  )
              } ${farmingToken.title}`}
              />
              <PriceImpact priceImpact={this.bloc.leverageImpact$.value || this.bloc.priceImpact$.value} />
              <SlippageSetting />
              <LabelAndValue
                className="ClosePosition__totalReceived"
                label={I18n.t('totalReceivedAsset')}
                value={(
                  <>
                    <p>{noRounding(new BigNumber(this.bloc.receiveFarmTokenAmt$.value || 0).div(10 ** farmingToken.decimals).toNumber(), 4)} {farmingToken.title}</p>
                    <p>{noRounding(new BigNumber(this.bloc.receiveBaseTokenAmt$.value || 0).div(10 ** baseToken.decimals).toNumber(), 4)} {baseToken.title}</p>
                  </>
                )}
              />
            </div>
          </div>
        </div>
        <div className="ClosePosition__footer">
          {this.renderButtons()}
        </div>
      </div>
    )
  }
}

export default ClosePosition