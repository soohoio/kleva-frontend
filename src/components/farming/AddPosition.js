import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators'

import Bloc from './AddPosition.bloc'
import './AddPosition.scss'
import AddPositionHeader from './AddPositionHeader'
import { getOptimalAmount, toAPY } from '../../utils/calc'
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
import { addressKeyFind, isSameAddress, nFormatter, noRounding } from '../../utils/misc'
import { checkAllowances$ } from '../../streams/contract'
import { getIbTokenFromOriginalToken, isKLAY, tokenList } from '../../constants/tokens'
import WKLAYSwitcher from '../common/WKLAYSwitcher'
import Checkbox from '../common/Checkbox'
import { klayswapPoolInfo$ } from '../../streams/farming'

class AddPosition extends Component {
  bloc = new Bloc(this)

  destroy$ = new Subject()
  
  componentDidMount() {
    const { lpToken } = this.props
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
      // If the user changes farmingTokenAmount || baseTokenAmount || leverage
      // call view function `getOpenPositionResult`,
      // it leads to fill following behavior subject,
      // i) positionValue$
      // : result of calling view function `getPositionValue(workerAddress, *baseAmt without leverage, farmAmt)`
      // ii) resultBaseTokenAmount$, resultFarmTokenAmount$
      // iii) priceImpact$, leverageImpact$
      merge(
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
      ).pipe(
        switchMap(() => this.bloc.getOpenPositionResult$()),
        tap(() => {
          
          // Check leverage available
          const estimatedPositionValueWithoutLeverage = this.bloc.estimatedPositionValueWithoutLeverage$.value
          const amountToBorrow = this.bloc.getAmountToBorrow()

          const newPositionValue = new BigNumber(estimatedPositionValueWithoutLeverage)
            .plus(amountToBorrow)
            .toString()

          const newDebtValue = new BigNumber(amountToBorrow).toString()

          // Min Debt Size Check
          const ibToken = getIbTokenFromOriginalToken(this.bloc.borrowingAsset$.value)

          const { workFactorBps } = this.bloc.getConfig()

          const isDebtSizeValid = newDebtValue == 0 || new BigNumber(newDebtValue).gte(ibToken?.minDebtSize)

          const a1 = new BigNumber(newPositionValue).multipliedBy(workFactorBps).toString()
          const a2 = new BigNumber(newDebtValue).multipliedBy(10 ** 4).toString()

          const _borrowMoreAvailable = new BigNumber(a1).isGreaterThan(a2)

          this.bloc.isDebtSizeValid$.next(isDebtSizeValid)
          this.bloc.borrowMoreAvailable$.next(isDebtSizeValid && _borrowMoreAvailable)
        })
      ),
      this.bloc.isLoading$,
      this.bloc.baseToken$,
      this.bloc.farmingToken$,
      this.bloc.estimatedPositionValueWithoutLeverage$,
      this.bloc.resultBaseTokenAmount$,
      this.bloc.resultFarmTokenAmount$,
      this.bloc.leverageImpact$,
      this.bloc.priceImpact$,
      this.bloc.borrowingAsset$,
      // If worker changed, 
      // 1) check current leverage is suitable for the leverage cap
      // -> If it is higher than leverage cap, lower it
      // 2) reset farmingTokenAmount$, baseTokenAmount$ to 0
      this.bloc.worker$.pipe(
        distinctUntilChanged((a, b) => {
          return a.workerAddress === b.workerAddress
        }),
        tap(() => {
          const { leverageCap } = this.bloc.getConfig()
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
          worker.vaultAddress,
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
    const { token1, token2 } = this.props
    const { ibToken, farmingToken, baseToken } = this.bloc.getTokens()

    // Allowance check
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

    // Available balance check
    const availableFarmingTokenAmount = isKLAY(farmingToken.address) 
      ? balancesInWallet$.value[tokenList.WKLAY.address]
      : balancesInWallet$.value[farmingToken.address]
    const availableBaseTokenAmount = isKLAY(baseToken.address)
      ? balancesInWallet$.value[tokenList.WKLAY.address]
      : balancesInWallet$.value[baseToken.address]

    const isDisabled =
      new BigNumber(this.bloc.baseTokenAmount$.value || 0).gt(availableBaseTokenAmount?.balanceParsed)
      || new BigNumber(this.bloc.farmingTokenAmount$.value || 0).gt(availableFarmingTokenAmount?.balanceParsed)
      || (this.bloc.baseTokenAmount$.value == 0 && this.bloc.farmingTokenAmount$.value == 0)
      || this.bloc.borrowMoreAvailable$.value == false
      || !this.bloc.isDebtSizeValid$.value

    return (
      <>
        {!this.bloc.isDebtSizeValid$.value && (
          <p className="AddPosition__minDebtSize">
            {I18n.t('farming.error.minDebtSize', {
              minDebt: `${nFormatter(new BigNumber(ibToken.minDebtSize).div(10 ** ibToken.decimals).toNumber(), 2)} ${this.bloc.borrowingAsset$.value?.title}`
            })}
          </p>
        )}
        {(!isFarmingTokenApproved || !isBaseTokenApproved) && (
          <p className="AddPosition__needApprove">{I18n.t('needApprove')}</p>
        )}
        <div className="AddPosition__buttons">
          <button onClick={() => closeContentView$.next(true)} className="AddPosition__cancelButton">
            {I18n.t('cancel')}
          </button>
          {!isFarmingTokenApproved && (
            <button
              onClick={() => this.bloc.approve(farmingToken, this.bloc.worker$.value.vaultAddress)}
              className="AddPosition__button"
            >
              {this.bloc.isLoading$.value
                ? "..."
                : I18n.t('approveToken', {
                  token: isKLAY(farmingToken.address)
                    ? 'WKLAY'
                    : farmingToken.title
                })
              }
            </button>
          )}
          {!isBaseTokenApproved && (
            <button
              onClick={() => this.bloc.approve(baseToken, this.bloc.worker$.value.vaultAddress)}
              className="AddPosition__button"
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
                this.bloc.addPosition()
              }}
              className={cx("AddPosition__button", {
                "AddPosition__button--disabled": isDisabled,
              })}
            >
              {this.bloc.isLoading$.value
                ? "..."
                : I18n.t('farming')
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
            key="case1-1"
            focused$={this.bloc.isBaseFocused$}
            headerRightContent={(
              <Checkbox title={I18n.t('fiftyfiftyMode')} checked$={this.bloc.fiftyfiftyMode$} />
            )}
            decimalLimit={baseToken.decimals}
            value$={this.bloc.baseTokenAmount$}
            valueLimit={balancesInWallet$.value[baseToken.address] && balancesInWallet$.value[baseToken.address].balanceParsed}
            labelValue={balancesInWallet$.value[baseToken.address] && balancesInWallet$.value[baseToken.address].balanceParsed}
            imgSrc={baseToken.iconSrc}
            labelTitle={`${I18n.t('farming.controller.available')} ${baseToken.title}`}
            targetToken={baseToken}
          />
          <SupplyInput
            key="case1-2"
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
            key="case2-1"
            focused$={this.bloc.isFarmingFocused$}
            headerRightContent={(
              <Checkbox title={I18n.t('fiftyfiftyMode')} checked$={this.bloc.fiftyfiftyMode$} />
            )}
            decimalLimit={farmingToken.decimals}
            value$={this.bloc.farmingTokenAmount$}
            valueLimit={balancesInWallet$.value[farmingToken.address] && balancesInWallet$.value[farmingToken.address].balanceParsed}
            labelValue={balancesInWallet$.value[farmingToken.address] && balancesInWallet$.value[farmingToken.address].balanceParsed}
            imgSrc={farmingToken.iconSrc}
            labelTitle={`${I18n.t('farming.controller.available')} ${farmingToken.title}`}
            targetToken={farmingToken}
          />
          <SupplyInput
            key="case2-2"
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

    // make token1 position to upper side.
    if (isSameAddress(token1.address, farmingToken.address)) {
      return (
        <>
          <SupplyInput
            key="case3-1"
            focused$={this.bloc.isFarmingFocused$}
            headerRightContent={(
              <Checkbox title={I18n.t('fiftyfiftyMode')} checked$={this.bloc.fiftyfiftyMode$} />
            )}
            decimalLimit={farmingToken.decimals}
            value$={this.bloc.farmingTokenAmount$}
            valueLimit={balancesInWallet$.value[farmingToken.address] && balancesInWallet$.value[farmingToken.address].balanceParsed}
            labelValue={balancesInWallet$.value[farmingToken.address] && balancesInWallet$.value[farmingToken.address].balanceParsed}
            imgSrc={farmingToken.iconSrc}
            labelTitle={`${I18n.t('farming.controller.available')} ${farmingToken.title}`}
            targetToken={farmingToken}
          />
          <SupplyInput
            key="case3-2"
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
          key="case4-1"
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
          key="case4-2"
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
    const { farmingToken, baseToken } = this.bloc.getTokens()

    if (isKLAY(farmingToken.address)) {
      return (
        <>
          <p>{nFormatter(resultBaseTokenAmount)} {baseToken.title}</p>
          <p>{nFormatter(resultFarmingTokenAmount)} {farmingToken.title}</p>
        </>
      )
    }

    if (isKLAY(baseToken.address)) {
      return (
        <>
          <p>{nFormatter(resultFarmingTokenAmount)} {farmingToken.title}</p>
          <p>{nFormatter(resultBaseTokenAmount)} {baseToken.title}</p>
        </>
      )
    }

    // make token1 position upper side

    if (isSameAddress(token1.address, farmingToken.address)) {
      return (
        <>
          <p>{nFormatter(resultFarmingTokenAmount)} {farmingToken.title}</p>
          <p>{nFormatter(resultBaseTokenAmount)} {baseToken.title}</p>
        </>
      )
    }

    return (
      <>
        <p>{nFormatter(resultBaseTokenAmount)} {baseToken.title}</p>
        <p>{nFormatter(resultFarmingTokenAmount)} {farmingToken.title}</p>
      </>
    )
  }
  
  renderEquityValue = ({
    farmingTokenAmount,
    baseTokenAmount,
  }) => {
    const { token1 } = this.props
    const { farmingToken, baseToken } = this.bloc.getTokens()

    if (isKLAY(farmingToken.address)) {
      return (
        <>
          <p>{nFormatter(baseTokenAmount)} {baseToken.title}</p>
          <p>{nFormatter(farmingTokenAmount)} {farmingToken.title}</p>
        </>
      )
    }

    if (isKLAY(baseToken.address)) {
      return (
        <>
          <p>{nFormatter(farmingTokenAmount)} {farmingToken.title}</p>
          <p>{nFormatter(baseTokenAmount)} {baseToken.title}</p>
        </>
      )
    }

    if (isSameAddress(token1.address, farmingToken.address)) {
      return (
        <>
          <p>{nFormatter(farmingTokenAmount)} {farmingToken.title}</p>
          <p>{nFormatter(baseTokenAmount)} {baseToken.title}</p>
        </>
      )
    }

    return (
      <>
        <p>{nFormatter(baseTokenAmount)} {baseToken.title}</p>
        <p>{nFormatter(farmingTokenAmount)} {farmingToken.title}</p>
      </>
    )
  }
    
  render() {
    const { 
      title,
      token1,
      token2,
      offset, 
      baseBorrowingInterests,
    } = this.props

    // tokens
    const { farmingToken, baseToken } = this.bloc.getTokens()

    // config
    const { leverageCap } = this.bloc.getConfig()

    // before / after
    const { 
      after_yieldFarmingAPR,
      after_tradingFeeAPR,
      after_klevaRewardsAPR,
      after_borrowingInterestAPR,
      after_totalAPR,
    } = this.bloc.getBeforeAfter()

    const apy = toAPY(after_totalAPR)

    const borrowingAmount = new BigNumber(this.bloc.getAmountToBorrow())
      .div(10 ** baseToken.decimals)
      .toNumber()

    const radioList = baseBorrowingInterests && Object.entries(baseBorrowingInterests)
      .filter(([address, { baseInterest }]) => {
        return baseInterest != 0
      })
      .map(([address, { token, baseInterest }]) => {
        return {
          asset: token,
          label: `${I18n.t('borrow', { title: token.title })}`,
          value: `${new BigNumber(baseInterest)
            .multipliedBy(this.bloc.leverage$.value - 1)
            .toFixed(2)}%`,
        }
      })

    const { farmingValue, baseValue } = this.bloc.getValueInUSD()

    const resultFarmingTokenAmount = new BigNumber(this.bloc.resultFarmTokenAmount$.value)
      .div(10 ** farmingToken.decimals)
      .toNumber()

    const resultBaseTokenAmount = new BigNumber(this.bloc.resultBaseTokenAmount$.value)
      .div(10 ** baseToken.decimals)
      .toNumber()

    const isKlayRelatedFarm = isKLAY(baseToken.address) || isKLAY(farmingToken.address)

    return (
      <div className="AddPosition">
        <div className="AddPosition__content">
          <div className="AddPosition__left">
            <div className="AddPosition__floatingHeader">
              <AddPositionHeader
                title={title}
              />
              <LabelAndValue
                className="AddPosition__apy"
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
                                title={`${token1.title}+${token2.title}`}
                                token1={token1}
                                token2={token2}
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
            
            {this.renderSupplyInput({ baseToken, farmingToken })}
            <LeverageInput
              offset={offset}
              leverageCap={leverageCap}
              setLeverage={this.bloc.setLeverageValue}
              leverage$={this.bloc.leverage$}
            />
            <div className="AddPosition__borrowingAssetList">
              {radioList.map(({ asset, label, value }) => {
                const isActive = this.bloc.borrowingAsset$.value?.address.toLowerCase() == asset?.address?.toLowerCase()

                return (
                  <BorrowingItem
                    active={isActive}
                    onClick={() => {
                      this.bloc.selectWorker(asset)
                    }}
                    label={label}
                    value={value}
                  />
                )
              })}
            </div>
          </div>
          <hr className="AddPosition__hr AddPosition__hr--mobile" />
          <div className="AddPosition__right">
            {/* if wklay included in pair, value2 is always wklay's ratio even if the borrowing asset is not WKLAY. */}
            {isKlayRelatedFarm
              ? (
                <TokenRatio
                  value1={isKLAY(farmingToken.address) ? baseValue : farmingValue}
                  value2={isKLAY(baseToken.address) ? baseValue : farmingValue}
                />
              )
              : (
                <TokenRatio
                  value1={farmingValue}
                  value2={baseValue}
                />
              )
            }
            <PriceImpact 
              priceImpact={this.bloc.leverageImpact$.value || this.bloc.priceImpact$.value} 
            />
            <SlippageSetting />
            
            <LabelAndValue
              className="AddPosition__equity"
              label={(
                <>
                  <p>{I18n.t('myasset.farming.equityValue.addPosition')}</p>
                  {/* <p>{I18n.t('farming.summary.equity.description')}</p> */}
                </>
              )}
              value={this.renderEquityValue({
                farmingTokenAmount: this.bloc.farmingTokenAmount$.value,
                baseTokenAmount: this.bloc.baseTokenAmount$.value,
              })}
            />
            <LabelAndValue
              className="AddPosition__debt"
              label={I18n.t('myasset.farming.debtValue.addPosition')}
              value={`${nFormatter(borrowingAmount)} ${baseToken.title}`}
            />
            <LabelAndValue
              className="AddPosition__totalDeposit"
              label={I18n.t('farming.summary.totalDeposit')}
              value={this.renderTotalValue({
                resultFarmingTokenAmount,
                resultBaseTokenAmount,
              })}
            />
          </div>
        </div>
        <div className="AddPosition__footer">
          {this.renderButtons()}
        </div>
      </div>
    )
  }
}

export default AddPosition