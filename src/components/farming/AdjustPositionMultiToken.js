import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of, forkJoin, BehaviorSubject } from 'rxjs'
import { takeUntil, tap, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators'

import Bloc from './AdjustPositionMultiToken.bloc'
import './AdjustPositionMultiToken.scss'
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
import { borrowMore$, checkAllowances$, getLpIngridients$, getPositionInfo$, getPositionInfo_single$ } from '../../streams/contract'
import { getIbTokenFromOriginalToken, isKLAY, isWKLAY, tokenList } from '../../constants/tokens'
import WKLAYSwitcher from '../common/WKLAYSwitcher'
import Tabs from '../common/Tabs'
import BeforeAfter from '../BeforeAfter'
import ThickHR from '../common/ThickHR'
import { klayswapPoolInfo$ } from '../../streams/farming'
import Checkbox from '../common/Checkbox'
import { liquidities$ } from '../../streams/tokenPrice'
import PoolTokenRatio from './PoolTokenRatio';
import PoolTokenRatioBeforeAfter from './PoolTokenRatioBeforeAfter';
import LPImpactInfoModal from '../modals/LPImpactInfoModal';

class AdjustPositionMultiToken extends Component {
  destroy$ = new Subject()

  bloc = new Bloc(this)

  componentDidMount() {
    const { token1, token2, token3, token4 } = this.props

    merge(
      balancesInWallet$,
      klayswapPoolInfo$,
      liquidities$,

      this.bloc.baseTokenNum$,
      this.bloc.otherTokens$,
      this.bloc.token1Amount$,
      this.bloc.token2Amount$,
      this.bloc.token3Amount$,
      this.bloc.token4Amount$,
      this.bloc.isToken1Focused$,
      this.bloc.isToken2Focused$,
      this.bloc.isToken3Focused$,
      this.bloc.isToken4Focused$,
      this.bloc.resultTokensAmount$,
      this.bloc.lpChangeRatio$,
      this.bloc.isLpGain$,
      this.bloc.resultNewLpAmount$,
      merge(
        this.bloc.token1Amount$,
        this.bloc.token2Amount$,
        this.bloc.token3Amount$,
        this.bloc.token4Amount$,
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

          const newDebtValue = new BigNumber(this.bloc.before_debtAmount$.value)
            .plus(amountToBeBorrowed)
            .toString()

          this.bloc.newDebtValue$.next(newDebtValue)

          const newEquityValue = new BigNumber(newPositionValue)
            .minus(newDebtValue)
            .toString()

          const finalCalculatedLeverage = new BigNumber(newPositionValue).div(newEquityValue).toNumber()
          this.bloc.finalCalculatedLeverage$.next(finalCalculatedLeverage)

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
      this.bloc.positionValue$,
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

          this.bloc.token1Amount$.next('')
          this.bloc.token2Amount$.next('')
          this.bloc.token3Amount$.next('')
          this.bloc.token4Amount$.next('')
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
        return checkAllowances$(
          selectedAddress$.value,
          this.props.vaultAddress,
          [token1, token2, token3, token4].filter((t) => !!t)
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
    let { 
      farmingToken,
      baseToken,
      vaultAddress,
      token1,
      token2,
      token3,
      token4,
    } = this.props

    const ibToken = getIbTokenFromOriginalToken(baseToken)

    // @IMPORTANT MUTATE
    token1 = isKLAY(token1.address) ? tokenList.WKLAY : token1
    token2 = isKLAY(token2.address) ? tokenList.WKLAY : token2
    token3 = (token3 && isKLAY(token3.address)) ? tokenList.WKLAY : token3
    token4 = (token4 && isKLAY(token4.address)) ? tokenList.WKLAY : token4

    // Allowance check
    const token1Allowance = addressKeyFind(this.bloc.allowances$.value, token1?.address)
    const token2Allowance = addressKeyFind(this.bloc.allowances$.value, token2?.address)
    const token3Allowance = addressKeyFind(this.bloc.allowances$.value, token3?.address)
    const token4Allowance = addressKeyFind(this.bloc.allowances$.value, token4?.address)

    const isToken1Approved = this.bloc.token1Amount$.value == 0 || (token1Allowance && token1Allowance != 0)
    const isToken2Approved = this.bloc.token2Amount$.value == 0 || (token2Allowance && token2Allowance != 0)
    const isToken3Approved = this.bloc.token3Amount$.value == 0 || (token3Allowance && token3Allowance != 0)
    const isToken4Approved = this.bloc.token4Amount$.value == 0 || (token4Allowance && token4Allowance != 0)

    // Available balance check
    const availableToken1Amount = balancesInWallet$.value[token1?.address]
    const availableToken2Amount = balancesInWallet$.value[token2?.address]
    const availableToken3Amount = balancesInWallet$.value[token3?.address]
    const availableToken4Amount = balancesInWallet$.value[token4?.address]

    const exceedAvailBalance = new BigNumber(availableToken1Amount).gt(this.bloc.token1Amount$.value)
      || new BigNumber(availableToken2Amount).gt(this.bloc.token2Amount$.value)
      || new BigNumber(availableToken3Amount).gt(this.bloc.token3Amount$.value)
      || new BigNumber(availableToken4Amount).gt(this.bloc.token4Amount$.value) 

    const needTokenApproval = !(isToken1Approved && isToken2Approved && isToken3Approved && isToken4Approved)

    const otherTokensAmountSum = this.bloc.getOtherTokensAmountSum()

    const baseTokenAmount = this.bloc.getBaseTokenAmount()

    const isAddCollateralDisabled =
      exceedAvailBalance 
      || (baseTokenAmount == 0 && otherTokensAmountSum == 0)
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
          <p className="AdjustPositionMultiToken__minDebtSize">
            {I18n.t('farming.error.minDebtSize', {
              minDebt: `${nFormatter(new BigNumber(ibToken.minDebtSize).div(10 ** ibToken.decimals).toNumber(), 2)} ${this.bloc.borrowingAsset$.value?.title}`
            })}
          </p>
        )}
        {needTokenApproval && (
          <p className="AddPosition__needApprove">{I18n.t('needApprove')}</p>
        )}
        <div className="AdjustPositionMultiToken__buttons">
          <button onClick={() => closeContentView$.next(true)} className="AdjustPositionMultiToken__cancelButton">
            {I18n.t('cancel')}
          </button>
          {!isToken1Approved && (
            <button
              onClick={() => this.bloc.approve(token1, vaultAddress)}
              className="AdjustPositionMultiToken__button"
            >
              {this.bloc.isLoading$.value
                ? "..."
                : I18n.t('approveToken', {
                  token: token1.title
                })
              }
            </button>
          )}
          {!isToken2Approved && (
            <button
              onClick={() => this.bloc.approve(token2, vaultAddress)}
              className="AdjustPositionMultiToken__button"
            >
              {this.bloc.isLoading$.value
                ? "..."
                : I18n.t('approveToken', {
                  token: token2.title
                })
              }
            </button>
          )}
          {!isToken3Approved && (
            <button
              onClick={() => this.bloc.approve(token3, vaultAddress)}
              className="AdjustPositionMultiToken__button"
            >
              {this.bloc.isLoading$.value
                ? "..."
                : I18n.t('approveToken', {
                  token: token3.title
                })
              }
            </button>
          )}
          {!isToken4Approved && (
            <button
              onClick={() => this.bloc.approve(token4, vaultAddress)}
              className="AdjustPositionMultiToken__button"
            >
              {this.bloc.isLoading$.value
                ? "..."
                : I18n.t('approveToken', {
                  token: token4.title
                })
              }
            </button>
          )}
          {!needTokenApproval && (

            <button
              onClick={() => {
                if (isDisabled) return

                if (this.bloc.borrowMore$.value) {
                  this.bloc.borrowMore()
                  return
                }

                this.bloc.addCollateral()
              }}
              className={cx("AdjustPositionMultiToken__button", {
                "AdjustPositionMultiToken__button--disabled": isDisabled,
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

  renderSupplyInput = () => {
    let { token1, token2, token3, token4 } = this.props

    // @IMPORTANT Mutate
    token1 = isKLAY(token1.address) ? tokenList.WKLAY : token1
    token2 = isKLAY(token2.address) ? tokenList.WKLAY : token2
    token3 = (token3 && isKLAY(token3.address)) ? tokenList.WKLAY : token3
    token4 = (token4 && isKLAY(token4.address)) ? tokenList.WKLAY : token4

    const sorted = [
      { token: token1, value$: this.bloc.token1Amount$, focused$: this.bloc.isToken1Focused$ },
      { token: token2, value$: this.bloc.token2Amount$, focused$: this.bloc.isToken2Focused$ },
      { token: token3, value$: this.bloc.token3Amount$, focused$: this.bloc.isToken3Focused$ },
      { token: token4, value$: this.bloc.token4Amount$, focused$: this.bloc.isToken4Focused$ },
    ]
      .filter(({ token }) => !!token)
      .sort((a, b) => {
        return isWKLAY(b.token.address) ? -1 : 0
      })

    return (
      <>
        {sorted.map(({ token, value$, focused$ }) => {
          return (
            <>
              <SupplyInput
                isProcessing={this.bloc.isLoading$.value}
                focused$={focused$}
                decimalLimit={token.decimals}
                value$={value$}
                valueLimit={balancesInWallet$.value[token?.address] && balancesInWallet$.value[token?.address].balanceParsed}
                labelValue={balancesInWallet$.value[token?.address] && balancesInWallet$.value[token?.address].balanceParsed}
                imgSrc={token.iconSrc}
                labelTitle={`${I18n.t('farming.controller.available')} ${token.title}`}
                targetToken={token}
              />
              {isWKLAY(token.address) && (
                <WKLAYSwitcher
                  balancesInWallet={balancesInWallet$.value}
                  description={(
                    <p className="AddPosition__wklayConvertLabel">{I18n.t('lendstake.controller.wklaySwitch.title')}</p>
                  )}
                />
              )}
            </>
          )
        })}
      </>
    )
  }

  renderTotalValue = () => {
    const { token1 } = this.props
    const { tokens } = this.bloc.getTokens()

    return (
      <>
        {tokens.map((token, idx) => {
          const amount = new BigNumber(this.bloc.resultTokensAmount$.value[idx]).div(10 ** token.decimals).toString()
          return (
            <p>{nFormatter(amount)} {token.title}</p>
          )
        })}
      </>
    )
  }

  renderEquityValue = () => {
    const { 
      token1, 
      token2, 
      token3, 
      token4,
      token1Amt,
      token2Amt,
      token3Amt,
      token4Amt,
    } = this.props

    const token1Amount = new BigNumber(token1Amt)
      .plus(this.bloc.token1Amount$.value || 0)
      .toString()
    const token2Amount = new BigNumber(token2Amt)
      .plus(this.bloc.token2Amount$.value || 0)
      .toString()
    const token3Amount = new BigNumber(token3Amt)
      .plus(this.bloc.token3Amount$.value || 0)
      .toString()
    const token4Amount = new BigNumber(token4Amt)
      .plus(this.bloc.token4Amount$.value || 0)
      .toString()

    return (
      <>
        {token1 && <p>{nFormatter(token1Amount)} {token1.title}</p>}
        {token2 && <p>{nFormatter(token2Amount)} {token2.title}</p>}
        {token3 && <p>{nFormatter(token3Amount)} {token3.title}</p>}
        {token4 && <p>{nFormatter(token4Amount)} {token4.title}</p>}
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

      baseToken,

      lpToken,
      selectedAddress,

      offset,
      setLeverage,

      baseBorrowingInterestAPR,
      baseBorrowingInterests,
    } = this.props

    const baseTokenTitle = isKLAY(baseToken.address) ? "WKLAY" : baseToken.title

    // config
    const { leverageCap } = this.bloc.getConfig()

    // before / after
    const {
      after_totalAPR,
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

    const apy = toAPY(after_totalAPR)

    const lpTokenRatio = addressKeyFind(liquidities$.value, lpToken.address)

    const { borrowIncludedTokenAmounts } = this.bloc.getTokenAmountsPure()
    const lpTVLAfter = borrowIncludedTokenAmounts.reduce((acc, cur, idx) => {
      const token = this.bloc.tokens && this.bloc.tokens[idx]
      const tokenPrice = addressKeyFind(tokenPrices$.value, token?.address)

      return new BigNumber(acc)
        .plus(new BigNumber(cur || 0).div(10 ** token?.decimals).multipliedBy(tokenPrice))
        .toString()
    }, lpTokenRatio[0].lpTVL)

    const lpTokenRatioList = lpTokenRatio.map(({ token, amount, lpTVL }, idx) => {
      const tokenPrice = addressKeyFind(tokenPrices$.value, token.address)
      const valueInUSD = new BigNumber(amount).multipliedBy(tokenPrice).toNumber()
      const ratio = new BigNumber(valueInUSD).div(lpTVL).multipliedBy(100).toNumber()


      const newlyAddedValue = new BigNumber(borrowIncludedTokenAmounts[idx] || 0)
        .div(10 ** token.decimals)
        .multipliedBy(tokenPrice)
        .toString()

      const ratioAfter = new BigNumber(valueInUSD)
        .plus(newlyAddedValue)
        .div(lpTVLAfter)
        .multipliedBy(100)
        .toNumber()

      return {
        token,
        valueInUSD,
        tokenRatio: ratio,
        tokenRatioAfter: ratioAfter,
      }
    })

    const borrowingAmount = new BigNumber(this.bloc.getAmountToBorrow())
      .div(10 ** baseToken.decimals)
      .toNumber()

    const resultDebtAmount = new BigNumber(this.bloc.newDebtValue$.value)
      .div(10 ** baseToken.decimals)
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
      <div className="AdjustPositionMultiToken">
        <div className="AdjustPositionMultiToken__content">
          <div className="AdjustPositionMultiToken__left">
            <div className="AdjustPositionMultiToken__floatingHeader">
              <ModalHeader
                title={title}
              />
              <LabelAndValue
                className="AdjustPositionMultiToken__apy"
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
            </div>

            <PoolTokenRatio
              className="PoolTokenRatio PoolTokenRatio--mobileOnly"
              lpToken={lpToken}
              list={lpTokenRatioList}
            />
            <Tabs
              className="AdjustPositionMultiToken__tabs"
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
                    className="AdjustPositionMultiToken__borrowingAsset"
                    label={I18n.t('farming.adjustPosition.borrowingAsset')}
                    value={`${nFormatter(debtDelta)} ${baseTokenTitle}`}
                  />
                  <LabelAndValue
                    className="AdjustPositionMultiToken__debtRatio2"
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
                  {this.renderSupplyInput()}
                </>
              )
            }
          </div>
          <ThickHR />
          <div className="AdjustPositionMultiToken__right">
            {/* lp token ratio */}
            <PoolTokenRatio
              className="PoolTokenRatio PoolTokenRatio--desktopOnly"
              lpToken={lpToken}
              list={lpTokenRatioList}
            />
            {/* lp token ratio (after) */}
            <PoolTokenRatioBeforeAfter
              list={lpTokenRatioList}
            />
            <PriceImpact
              title={I18n.t('lossByTokenRatio')}
              description={I18n.t('lpImpact')}
              priceImpact={this.bloc.lpChangeRatio$.value}
              isGain={this.bloc.isLpGain$.value}
              infoModal={<LPImpactInfoModal />}
            />
            <SlippageSetting 
              title={I18n.t('slippageSetting.kokonut')}
            />

            {!this.bloc.borrowMore$.value && (
              <LabelAndValue
                className="AdjustPositionMultiToken__debtRatio"
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
            )}

            <LabelAndValue
              className="AdjustPositionMultiToken__equity"
              label={(
                <>
                  {this.bloc.borrowMore$.value
                    ? <p>{I18n.t('myasset.farming.equityValue.borrowMore')}</p>
                    : (
                      <>
                        <p>{I18n.t('myasset.farming.equityValue.addCollateral.kokonut')}</p>
                        <p className="AdjustPositionMultiToken__equitySubDescription">{I18n.t('farming.summary.equity.description')}</p>
                      </>
                    )
                  }
                </>
              )}
              value={this.renderEquityValue()}
            />
            <LabelAndValue
              className="AdjustPositionMultiToken__debt"
              label={I18n.t('farming.summary.debt')}
              value={`${nFormatter(resultDebtAmount)} ${baseTokenTitle}`}
            />
            <LabelAndValue
              className="AdjustPositionMultiToken__totalDeposit"
              label={I18n.t('farming.summary.totalDeposit')}
              value={this.renderTotalValue()}
            />
          </div>
        </div>
        <div className="AdjustPositionMultiToken__footer">
          {this.renderButtons()}
        </div>
      </div>
    )
  }
}

export default AdjustPositionMultiToken