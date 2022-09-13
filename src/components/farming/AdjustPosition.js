import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of, forkJoin, BehaviorSubject } from 'rxjs'
import { takeUntil, tap, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators'

import Bloc from './AdjustPosition.bloc'
import './AdjustPosition.scss'
import ModalHeader from '../modals/ModalHeader'
import { toAPY } from '../../utils/calc'
import { I18n } from '../common/I18n'
import SupplyInput from '../common/SupplyInput'
import LabelAndValue from '../LabelAndValue'
import { balancesInWallet$, selectedAddress$ } from '../../streams/wallet'
import QuestionMark from '../common/QuestionMark'
import { closeContentView$, openModal$ } from '../../streams/ui'
import FarmAPRDetailInfo2 from '../modals/FarmAPRDetailInfo2'
import LeverageInput from '../common/LeverageInput'
import TokenRatio from './TokenRatio'
import PriceImpact from './PriceImpact'
import SlippageSetting from './SlippageSetting'
import { addressKeyFind, isSameAddress, nFormatter, noRounding } from '../../utils/misc'
import { checkAllowances$, getLpIngridients$, getPositionInfo$, getPositionInfo_single$ } from '../../streams/contract'
import { getIbTokenFromOriginalToken, isKLAY, tokenList } from '../../constants/tokens'
import WKLAYSwitcher from '../common/WKLAYSwitcher'
import Tabs from '../common/Tabs'
import BeforeAfter from '../BeforeAfter'
import ThickHR from '../common/ThickHR'
import { klayswapPoolInfo$ } from '../../streams/farming'
import Checkbox from '../common/Checkbox'

class AdjustPosition extends Component {
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
      })
    ).subscribe(([{ baseAmt, farmAmt }, { positionValue, health, debtAmt }]) => {
      this.bloc.before_farmingAmount$.next(farmAmt)
      this.bloc.before_baseAmount$.next(baseAmt)
      this.bloc.before_positionValue$.next(positionValue)
      this.bloc.before_health$.next(health)
      this.bloc.before_debtAmount$.next(debtAmt)
      
      this.bloc.before_equityValue$.next(new BigNumber(positionValue).minus(debtAmt).toString())
    })

    merge(
      balancesInWallet$,
      klayswapPoolInfo$,
      this.bloc.isFarmingFocused$,
      this.bloc.isBaseFocused$,
      this.bloc.fiftyfiftyMode$.pipe(
        distinctUntilChanged(),
        tap((isModeOn) => {
          if (!isModeOn) return

          if (this.bloc.farmingTokenAmount$.value != 0) {
            return this.bloc.handleFiftyFiftyMode({ from: 'farmingToken' })
          }

          if (this.bloc.baseTokenAmount$.value != 0) {
            return this.bloc.handleFiftyFiftyMode({ from: 'baseToken' })
          }
        })
      ),
      merge(
        this.bloc.before_farmingAmount$,
        this.bloc.before_baseAmount$,

        this.bloc.farmingTokenAmount$.pipe(
          tap(() => {
            if (!this.bloc.fiftyfiftyMode$.value) return
            if (!this.bloc.isFarmingFocused$.value) return

            // fiftyfifty mode
            this.bloc.handleFiftyFiftyMode({ from: 'farmingToken' })
          }),
        ),
        this.bloc.baseTokenAmount$.pipe(
          tap(() => {
            if (!this.bloc.fiftyfiftyMode$.value) return
            if (!this.bloc.isBaseFocused$.value) return

            // fiftyfifty mode
            this.bloc.handleFiftyFiftyMode({ from: 'baseToken' })
          }),
        ),
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
      this.bloc.borrowMore$.pipe(
        distinctUntilChanged(),
        tap(() => {
          const { workerConfig, leverageCap } = this.bloc.getConfig()
          // If leverage value is greater than leverage cap, lower it to the leverage cap.
          if (new BigNumber(this.bloc.leverage$.value).gt(leverageCap)) {
            this.bloc.leverage$.next(leverageCap)
          }

          this.bloc.farmingTokenAmount$.next('')
          this.bloc.baseTokenAmount$.next('')
        })
      ),
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

  renderButtons = () => {
    const { farmingToken, baseToken, vaultAddress } = this.props

    const ibToken = getIbTokenFromOriginalToken(baseToken)

    const baseTokenAllowance = isKLAY(baseToken.address)
      ? addressKeyFind(this.bloc.allowances$.value, tokenList.WKLAY.address)
      : addressKeyFind(this.bloc.allowances$.value, baseToken.address)

    const isBaseTokenApproved = this.bloc.baseTokenAmount$.value == 0
      || (baseTokenAllowance && baseTokenAllowance != 0)

    const farmingTokenAllowance = isKLAY(farmingToken.address)
      ? addressKeyFind(this.bloc.allowances$.value, tokenList.WKLAY.address)
      : addressKeyFind(this.bloc.allowances$.value, farmingToken.address)

    const isFarmingTokenApproved = this.bloc.farmingTokenAmount$.value == 0
      || (farmingTokenAllowance && farmingTokenAllowance != 0)

    const availableFarmingTokenAmount = balancesInWallet$.value[farmingToken.address]
    const availableBaseTokenAmount = isKLAY(baseToken.address)
      ? balancesInWallet$.value[tokenList.WKLAY.address]
      : balancesInWallet$.value[baseToken.address]
      
    const isAddCollateralDisabled =
      new BigNumber(this.bloc.baseTokenAmount$.value).gt(availableBaseTokenAmount?.balanceParsed)
      || new BigNumber(this.bloc.farmingTokenAmount$.value).gt(availableFarmingTokenAmount?.balanceParsed)
      || (this.bloc.baseTokenAmount$.value == 0 && this.bloc.farmingTokenAmount$.value == 0)
      || !this.bloc.addCollateralAvailable$.value
      || !this.bloc.isDebtSizeValid$.value

    const isBorrowMoreDisabled = (Number(noRounding(this.bloc.leverage$.value, 2)) == Number(noRounding(this.props.currentPositionLeverage, 2)))
      || !this.bloc.borrowMoreAvailable$.value
      || !this.bloc.isDebtSizeValid$.value

    const isDisabled = this.bloc.borrowMore$.value
      ? isBorrowMoreDisabled
      : isAddCollateralDisabled

    return (
      <>
        {!this.bloc.isDebtSizeValid$.value && (
          <p className="AdjustPosition__minDebtSize">
            {I18n.t('farming.error.minDebtSize', {
              minDebt: `${nFormatter(new BigNumber(ibToken.minDebtSize).div(10 ** ibToken.decimals).toNumber(), 2)} ${this.bloc.borrowingAsset$.value?.title}`
            })}
          </p>
        )}
        {(!isFarmingTokenApproved || !isBaseTokenApproved) && (
          <p className="AdjustPosition__needApprove">{I18n.t('needApprove')}</p>
        )}
        <div className="AdjustPosition__buttons">
          <button onClick={() => closeContentView$.next(true)} className="AdjustPosition__cancelButton">
            {I18n.t('cancel')}
          </button>
          {!isFarmingTokenApproved && (
            <button
              onClick={() => this.bloc.approve(farmingToken, vaultAddress)}
              className="AdjustPosition__button"
            >
              {this.bloc.isLoading$.value
                ? "..."
                : I18n.t('approveToken', {
                  token: farmingTokenTitle
                })
              }
            </button>
          )}
          {!isBaseTokenApproved && (
            <button
              onClick={() => this.bloc.approve(baseToken, vaultAddress)}
              className="AdjustPosition__button"
            >
              {this.bloc.isLoading$.value
                ? "..."
                : I18n.t('approveToken', { token: baseToken.title })
              }
            </button>
          )}
          {isBaseTokenApproved && isFarmingTokenApproved && (

            <button
              onClick={() => {
                if (isDisabled) return
                
                if (this.bloc.borrowMore$.value) {
                  this.bloc.borrowMore()
                  return
                }

                this.bloc.addCollateral()
              }}
              className={cx("AdjustPosition__button", {
                "AdjustPosition__button--disabled": isDisabled,
              })}
            >
              {this.bloc.isLoading$.value
                ? "..."
                : this.bloc.borrowMore$.value 
                  ? I18n.t('farming.adjustPosition.borrowMore')
                  : I18n.t('farming.adjustPosition.addCollateral')
              }
            </button>
          )}
        </div>
      </>
    )
  }

  renderSupplyInput = ({ baseToken, farmingToken }) => {
    const { token1 } = this.props

    if (isKLAY(farmingToken.address)) {
      return (
        <>
          <SupplyInput
            headerRightContent={(
              <Checkbox title={I18n.t('fiftyfiftyMode')} checked$={this.bloc.fiftyfiftyMode$} />
            )}
            focused$={this.bloc.isBaseFocused$}
            decimalLimit={baseToken.decimals}
            value$={this.bloc.baseTokenAmount$}
            valueLimit={balancesInWallet$.value[baseToken.address] && balancesInWallet$.value[baseToken.address].balanceParsed}
            labelValue={balancesInWallet$.value[baseToken.address] && balancesInWallet$.value[baseToken.address].balanceParsed}
            imgSrc={baseToken.iconSrc}
            labelTitle={`${I18n.t('farming.controller.available')} ${baseToken.title}`}
            targetToken={baseToken}
          />
          <SupplyInput
            focused$={this.bloc.isFarmingFocused$}
            decimalLimit={farmingToken.decimals}
            value$={this.bloc.farmingTokenAmount$}
            valueLimit={balancesInWallet$.value[tokenList.WKLAY.address] && balancesInWallet$.value[tokenList.WKLAY.address].balanceParsed}
            labelValue={balancesInWallet$.value[tokenList.WKLAY.address] && balancesInWallet$.value[tokenList.WKLAY.address].balanceParsed}
            imgSrc={farmingToken.iconSrc}
            labelTitle={`${I18n.t('farming.controller.converted')} ${tokenList.WKLAY.title}`}
            targetToken={tokenList.WKLAY}
          />
          <WKLAYSwitcher
            balancesInWallet={balancesInWallet$.value}
            description={(
              <p className="AddPosition__wklayConvertLabel">{I18n.t('lendstake.controller.wklaySwitch.title')}</p>
            )}
          />
        </>
      )
    }

    if (isKLAY(baseToken.address)) {
      return (
        <>
          <SupplyInput
            headerRightContent={(
              <Checkbox title={I18n.t('fiftyfiftyMode')} checked$={this.bloc.fiftyfiftyMode$} />
            )}
            focused$={this.bloc.isFarmingFocused$}
            decimalLimit={farmingToken.decimals}
            value$={this.bloc.farmingTokenAmount$}
            valueLimit={balancesInWallet$.value[farmingToken.address] && balancesInWallet$.value[farmingToken.address].balanceParsed}
            labelValue={balancesInWallet$.value[farmingToken.address] && balancesInWallet$.value[farmingToken.address].balanceParsed}
            imgSrc={farmingToken.iconSrc}
            labelTitle={`${I18n.t('farming.controller.available')} ${farmingToken.title}`}
            targetToken={farmingToken}
          />
          <SupplyInput
            focused$={this.bloc.isBaseFocused$}
            decimalLimit={baseToken.decimals}
            value$={this.bloc.baseTokenAmount$}
            valueLimit={balancesInWallet$.value[tokenList.WKLAY.address] && balancesInWallet$.value[tokenList.WKLAY.address].balanceParsed}
            labelValue={balancesInWallet$.value[tokenList.WKLAY.address] && balancesInWallet$.value[tokenList.WKLAY.address].balanceParsed}
            imgSrc={tokenList.WKLAY.iconSrc}
            labelTitle={`${I18n.t('farming.controller.converted')} ${tokenList.WKLAY.title}`}
            targetToken={tokenList.WKLAY}
          />
          <WKLAYSwitcher
            balancesInWallet={balancesInWallet$.value}
            description={(
              <p className="AddPosition__wklayConvertLabel">{I18n.t('lendstake.controller.wklaySwitch.title')}</p>
            )}
          />
        </>
      )
    }

    if (isSameAddress(token1.address, farmingToken.address)) {
      return (
        <>
          <SupplyInput
            headerRightContent={(
              <Checkbox title={I18n.t('fiftyfiftyMode')} checked$={this.bloc.fiftyfiftyMode$} />
            )}
            focused$={this.bloc.isFarmingFocused$}
            decimalLimit={farmingToken.decimals}
            value$={this.bloc.farmingTokenAmount$}
            valueLimit={balancesInWallet$.value[farmingToken.address] && balancesInWallet$.value[farmingToken.address].balanceParsed}
            labelValue={balancesInWallet$.value[farmingToken.address] && balancesInWallet$.value[farmingToken.address].balanceParsed}
            imgSrc={farmingToken.iconSrc}
            labelTitle={`${I18n.t('farming.controller.available')} ${farmingToken.title}`}
            targetToken={farmingToken}
          />
          <SupplyInput
            focused$={this.bloc.isBaseFocused$}
            decimalLimit={baseToken.decimals}
            value$={this.bloc.baseTokenAmount$}
            valueLimit={balancesInWallet$.value[baseToken.address] && balancesInWallet$.value[baseToken.address].balanceParsed}
            labelValue={balancesInWallet$.value[baseToken.address] && balancesInWallet$.value[baseToken.address].balanceParsed}
            imgSrc={baseToken.iconSrc}
            labelTitle={`${I18n.t('farming.controller.available')} ${baseToken.title}`}
            targetToken={baseToken}
          />
        </>
      )
    }

    return (
      <>
        <SupplyInput
          headerRightContent={(
            <Checkbox title={I18n.t('fiftyfiftyMode')} checked$={this.bloc.fiftyfiftyMode$} />
          )}
          focused$={this.bloc.isBaseFocused$}
          decimalLimit={baseToken.decimals}
          value$={this.bloc.baseTokenAmount$}
          valueLimit={balancesInWallet$.value[baseToken.address] && balancesInWallet$.value[baseToken.address].balanceParsed}
          labelValue={balancesInWallet$.value[baseToken.address] && balancesInWallet$.value[baseToken.address].balanceParsed}
          imgSrc={baseToken.iconSrc}
          labelTitle={`${I18n.t('farming.controller.available')} ${baseToken.title}`}
          targetToken={baseToken}
        />
        <SupplyInput
          focused$={this.bloc.isFarmingFocused$}
          decimalLimit={farmingToken.decimals}
          value$={this.bloc.farmingTokenAmount$}
          valueLimit={balancesInWallet$.value[farmingToken.address] && balancesInWallet$.value[farmingToken.address].balanceParsed}
          labelValue={balancesInWallet$.value[farmingToken.address] && balancesInWallet$.value[farmingToken.address].balanceParsed}
          imgSrc={farmingToken.iconSrc}
          labelTitle={`${I18n.t('farming.controller.available')} ${farmingToken.title}`}
          targetToken={farmingToken}
        />
      </>
    )
  }

renderTotalValue = ({
    resultFarmingTokenAmount,
    resultBaseTokenAmount,
  }) => {
    const { token1 } = this.props
    const { farmingToken, baseToken } = this.props

    const farmingTokenTitle = isKLAY(farmingToken.address) ? "WKLAY" : farmingToken.title
    const baseTokenTitle = isKLAY(baseToken.address) ? "WKLAY" : baseToken.title

    if (isKLAY(farmingToken.address)) {
      return (
        <>
          <p>{nFormatter(resultBaseTokenAmount, 4)} {baseTokenTitle}</p>
          <p>{nFormatter(resultFarmingTokenAmount, 4)} {farmingTokenTitle}</p>
        </>
      )
    }

    if (isKLAY(baseToken.address)) {
      return (
        <>
          <p>{nFormatter(resultFarmingTokenAmount, 4)} {farmingTokenTitle}</p>
          <p>{nFormatter(resultBaseTokenAmount, 4)} {baseTokenTitle}</p>
        </>
      )
    }

    // make token1 position upper side
    if (isSameAddress(token1.address, farmingToken.address)) {
      return (
        <>
          <p>{nFormatter(resultFarmingTokenAmount, 4)} {farmingToken.title}</p>
          <p>{nFormatter(resultBaseTokenAmount, 4)} {baseToken.title}</p>
        </>
      )
    }

    return (
      <>
        <p>{nFormatter(resultBaseTokenAmount, 4)} {baseTokenTitle}</p>
        <p>{nFormatter(resultFarmingTokenAmount, 4)} {farmingTokenTitle}</p>
      </>
    )
  }

  renderTokenRatio = () => {
    const { baseToken, farmingToken } = this.props

    const { farmingValue, baseValue } = this.bloc.getValueInUSD()
    
    const isKlayRelatedFarm = isKLAY(baseToken.address) || isKLAY(farmingToken.address)
    if (isKlayRelatedFarm) {
      return (
        <TokenRatio
          value1={isKLAY(farmingToken.address) ? baseValue : farmingValue}
          value2={isKLAY(baseToken.address) ? baseValue : farmingValue}
        />
      )
    }

    return (
      <TokenRatio
        value1={farmingValue}
        value2={baseValue}
      />
    )
  }

  renderEquityValue = ({
    farmingTokenAmount,
    baseTokenAmount,
  }) => {
    const { token1 } = this.props
    const { farmingToken, baseToken } = this.props

    const farmingTokenTitle = isKLAY(farmingToken.address) ? "WKLAY" : farmingToken.title
    const baseTokenTitle = isKLAY(baseToken.address) ? "WKLAY" : baseToken.title

    if (isKLAY(farmingToken.address)) {
      return (
        <>
          <p>{nFormatter(baseTokenAmount, 4)} {baseTokenTitle}</p>
          <p>{nFormatter(farmingTokenAmount, 4)} {farmingTokenTitle}</p>
        </>
      )
    }

    if (isKLAY(baseToken.address)) {
      return (
        <>
          <p>{nFormatter(farmingTokenAmount, 4)} {farmingTokenTitle}</p>
          <p>{nFormatter(baseTokenAmount, 4)} {baseTokenTitle}</p>
        </>
      )
    }

    // make token1 position upper side
    if (isSameAddress(token1.address, farmingToken.address)) {
      return (
        <>
          <p>{nFormatter(farmingTokenAmount, 4)} {farmingTokenTitle}</p>
          <p>{nFormatter(baseTokenAmount, 4)} {baseTokenTitle}</p>
        </>
      )
    }

    return (
      <>
        <p>{nFormatter(baseTokenAmount, 4)} {baseTokenTitle}</p>
        <p>{nFormatter(farmingTokenAmount, 4)} {farmingTokenTitle}</p>
      </>
    )
  }

  render() {
    const {
      title,
      defaultLeverage,
      yieldFarmingAPR,
      tradingFeeAPR,
      workerInfo,

      farmingToken,
      baseToken,

      lpToken,
      selectedAddress,

      offset,
      setLeverage,

      baseBorrowingInterests,
    } = this.props

    const farmingTokenTitle = isKLAY(farmingToken.address) ? "WKLAY" : farmingToken.title
    const baseTokenTitle = isKLAY(baseToken.address) ? "WKLAY" : baseToken.title

    // config
    const { leverageCap } = this.bloc.getConfig()

    // before / after
    const {
      before_totalAPR,
      after_yieldFarmingAPR,
      after_tradingFeeAPR,
      after_klevaRewardsAPR,
      borrowingInfo,
      after_borrowingInterestAPR,
      after_totalAPR,
    } = this.bloc.getBeforeAfter()

    const apy = toAPY(after_totalAPR)

    const borrowingAmount = new BigNumber(this.bloc.getAmountToBorrow())
      .div(10 ** baseToken.decimals)
      .toNumber()

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
      .plus(this.bloc.farmingTokenAmount$.value || 0)
      .toNumber()
    
    const equityBaseAmount = new BigNumber(this.bloc.before_baseAmount$.value || 0)
      .div(10 ** baseToken.decimals)
      .plus(this.bloc.baseTokenAmount$.value || 0)
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

    return (
      <div className="AdjustPosition">
        <div className="AdjustPosition__content">
          <div className="AdjustPosition__left">
            <div className="AdjustPosition__floatingHeader">
              <ModalHeader
                title={title}
              />
              <LabelAndValue
                className="AdjustPosition__apy"
                label={I18n.t('apy')}
                value={(
                  <>
                    {Number(apy).toLocaleString('en-us', { maximumFractionDigits: 2 })}%
                    <QuestionMark
                      info
                      color="#265FFC"
                      onClick={() => {
                        openModal$.next({
                          component: (
                            <FarmAPRDetailInfo2
                              title={`${farmingToken.title}+${baseToken.title}`}
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
            </div>
            

            <Tabs
              className="AdjustPosition__tabs"
              list={[
                {
                  title: I18n.t('farming.adjustPosition.addCollateral'),
                  onClick: () => this.bloc.borrowMore$.next(false),
                  isActive: !this.bloc.borrowMore$.value,
                },
                {
                  title: I18n.t('farming.adjustPosition.borrowMore'),
                  onClick: () => this.bloc.borrowMore$.next(true),
                  isActive: this.bloc.borrowMore$.value,
                }
              ]}
            />
            {this.bloc.borrowMore$.value 
              ? (
                <>
                  <LeverageInput
                    offset={offset}
                    leverageLowerBound={this.props.currentPositionLeverage}
                    leverageCap={leverageCap}
                    setLeverage={this.bloc.setLeverageValue}
                    leverage$={this.bloc.leverage$}
                  />
                  <LabelAndValue
                    className="AdjustPosition__borrowingAsset" 
                    label={I18n.t('farming.adjustPosition.borrowingAsset')} 
                    value={`${nFormatter(debtDelta, 4)} ${baseTokenTitle}`}
                  />
                  <LabelAndValue 
                    className="AdjustPosition__debtRatio"
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
                </>
              )
              : (
                <>
                  {this.renderSupplyInput({baseToken, farmingToken})}
                </>
              )
            }
          </div>
          <ThickHR />
          <div className="AdjustPosition__right">
            {!this.bloc.borrowMore$.value && this.renderTokenRatio()}
            <PriceImpact 
              priceImpact={this.bloc.leverageImpact$.value || this.bloc.priceImpact$.value} 
            />
            <SlippageSetting />

            <LabelAndValue
              className="AdjustPosition__equity"
              label={(
                <>
                  <p>{I18n.t('farming.summary.equity')}</p>
                  <p>{I18n.t('farming.summary.equity.description')}</p>
                </>
              )}
              value={this.renderEquityValue({
                farmingTokenAmount: equityFarmingAmount,
                baseTokenAmount: equityBaseAmount,
              })}
            />
            <LabelAndValue
              className="AdjustPosition__debt"
              label={I18n.t('farming.summary.debt')}
              value={`${nFormatter(resultDebtAmount, 4)} ${baseTokenTitle}`}
            />
            <LabelAndValue
              className="AdjustPosition__totalDeposit"
              label={I18n.t('farming.summary.totalDeposit')}
              value={this.renderTotalValue({
                resultFarmingTokenAmount,
                resultBaseTokenAmount,
              })}
            />
          </div>
        </div>
        <div className="AdjustPosition__footer">
          {this.renderButtons()}
        </div>
      </div>
    )
  }
}

export default AdjustPosition