import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, switchMap, debounceTime } from 'rxjs/operators'
import BigNumber from 'bignumber.js'

import Modal from 'components/common/Modal'

import SupplyingAssets from 'components/SupplyingAssets'
import LeverageGauge from 'components/LeverageGauge'
import BorrowingAssets from 'components/BorrowingAssets'

import FarmSummary from 'components/FarmSummary'

import { balancesInWallet$ } from 'streams/wallet'

import Bloc from './AddPositionPopup.bloc'

import './AddPositionPopup.scss'
import { lendingTokenSupplyInfo$ } from '../streams/vault'
import { allowancesInLendingPool$, selectedAddress$ } from '../streams/wallet'
import { toNumber } from 'lodash'
import { calcInterestRate, calcKlevaRewardsAPR, getBufferedLeverage, toAPY } from '../utils/calc'
import { lendingPools, lendingPoolsByStakingTokenAddress } from '../constants/lendingpool'
import { checkAllowances$ } from '../streams/contract'
import { klevaAnnualRewards$, poolReserves$ } from '../streams/farming'
import { debtTokens, getIbTokenFromOriginalToken, tokenList } from '../constants/tokens'
import { tokenPrices$ } from '../streams/tokenPrice'
import APRAPYBrief from './APRAPYBrief'
import APRAPYDetailed from './APRAPYDetailed'
import Checkbox from './common/Checkbox'
import AddPositionPopupSummary from './AddPositionPopupSummary'
import { addressKeyFind, isSameAddress, nFormatter } from '../utils/misc'
import { closeLayeredModal$, layeredModalContentComponent$, openLayeredModal$ } from '../streams/ui'
import AreYouSureFarming from './common/AreYouSureFarming'

class AddPositionPopup extends Component {
  destroy$ = new Subject()

  constructor(props) {
    super(props)
    this.bloc = new Bloc(props)

    // Set default leverage first
    const { workerInfo } = this.props
    const workerConfig = addressKeyFind(workerInfo, this.bloc.worker$?.value?.workerAddress)
    const leverageCap = getBufferedLeverage(workerConfig?.workFactorBps)
    
    this.bloc.leverage$.next(Math.min(props.defaultLeverage, leverageCap))
  }
  
  componentDidMount() {
    merge(
      selectedAddress$,
      layeredModalContentComponent$,
      this.bloc.isLoading$,
      this.bloc.allowances$,
      this.bloc.borrowingAsset$,
      this.bloc.priceImpact$,
      this.bloc.worker$,
      this.bloc.farmingTokenAmountInBaseToken$,
      this.bloc.afterPositionValue$,
      
      this.bloc.showAPRDetail$,
      this.bloc.showSummary$,
      this.bloc.leverageImpact$,

      lendingTokenSupplyInfo$,
      tokenPrices$,
      klevaAnnualRewards$,
      balancesInWallet$,
      poolReserves$,
      this.bloc.borrowMoreAvailable$,
      this.bloc.isDebtSizeValid$,
      merge(
        this.bloc.farmingTokenAmount$.pipe(
          debounceTime(100),
          switchMap(() => {
            return this.bloc.calcFarmingTokenAmountInBaseToken$()
          })
        ),
        this.bloc.baseTokenAmount$,
        this.bloc.leverage$,
      ).pipe(
        debounceTime(100),
        tap(() => {
          this.bloc.getAfterPositionValue()
          this.bloc.getPriceImpact(poolReserves$.value)
          this.bloc.getLeverageImpact(poolReserves$.value)

          // this.bloc.getOpenPositionResult()

          // Check leverage available
          const { workerInfo } = this.props

          const positionValue = this.bloc.getPositionValue()
          const amountToBorrow = this.bloc.getAmountToBorrow()

          const newPositionValue = new BigNumber(positionValue).plus(amountToBorrow).toString()
          const newDebtValue = new BigNumber(amountToBorrow).toString()

          const workerConfig = workerInfo && workerInfo[this.bloc.worker$.value.workerAddress.toLowerCase()] || workerInfo[this.bloc.worker$.value.workerAddress]
          const workFactorBps = workerConfig && workerConfig.workFactorBps

          // Min Debt Size Check
          const ibToken = getIbTokenFromOriginalToken(this.bloc.borrowingAsset$.value)
          const isDebtSizeValid = newDebtValue == 0 || new BigNumber(newDebtValue).gte(ibToken?.minDebtSize)

          const a1 = new BigNumber(newPositionValue).multipliedBy(workFactorBps).toString()
          const a2 = new BigNumber(newDebtValue).multipliedBy(10 ** 4).toString()

          const _borrowMoreAvailable = new BigNumber(a1).isGreaterThan(a2)
          this.bloc.isDebtSizeValid$.next(isDebtSizeValid)
          this.bloc.borrowMoreAvailable$.next(isDebtSizeValid && _borrowMoreAvailable)
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

  renderButton = () => {
    const { title, leverage, onSelect } = this.props

    if (this.bloc.isLoading$.value) {
      return (
        <button
          className="AddPositionPopup__farmButton"
        >
          ...
        </button>
      )
    }

    const baseToken = this.bloc.baseToken$.value
    
    // KLAY -> WKLAY
    const isFarmingTokenKLAY = this.bloc.isKLAY(this.bloc.farmingToken$.value && this.bloc.farmingToken$.value.address)
    
    const farmingToken = isFarmingTokenKLAY 
      ? tokenList.WKLAY
      : this.bloc.farmingToken$.value

    const baseTokenAllowance = this.bloc.isKLAY(baseToken.address) 
      ? addressKeyFind(this.bloc.allowances$.value, tokenList.WKLAY.address)
      : addressKeyFind(this.bloc.allowances$.value, baseToken.address)

    const isBaseTokenApproved = this.bloc.baseTokenAmount$.value == 0 
      || (baseTokenAllowance && baseTokenAllowance != 0)

    const farmingTokenAllowance = this.bloc.allowances$.value[farmingToken.address]

    const isFarmingTokenApproved = this.bloc.farmingTokenAmount$.value == 0 
      || (farmingTokenAllowance && farmingTokenAllowance != 0)

    const availableFarmingTokenAmount = balancesInWallet$.value[farmingToken.address]
    const availableBaseTokenAmount = this.bloc.isKLAY(baseToken.address) 
      ? balancesInWallet$.value[tokenList.WKLAY.address]
      : balancesInWallet$.value[baseToken.address]

    // Base Token Allowance Check
    if (!isBaseTokenApproved) {
      return (
        <button
          onClick={() => this.bloc.approve(baseToken, this.bloc.worker$.value.vaultAddress)}
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
          onClick={() => this.bloc.approve(farmingToken, this.bloc.worker$.value.vaultAddress)}
          className="AddPositionPopup__farmButton"
        >
          Approve {farmingToken.title}
        </button>
      )
    }

    const isDisabled = 
      new BigNumber(this.bloc.baseTokenAmount$.value).gt(availableBaseTokenAmount?.balanceParsed) 
        || new BigNumber(this.bloc.farmingTokenAmount$.value).gt(availableFarmingTokenAmount?.balanceParsed)
        || (this.bloc.baseTokenAmount$.value == 0 && this.bloc.farmingTokenAmount$.value == 0)
        || this.bloc.borrowMoreAvailable$.value == false

    return (
      <button
        onClick={() => {
          if (isDisabled) return
          
          openLayeredModal$.next({
            component: (
              <AreYouSureFarming
                onCancel={() => closeLayeredModal$.next(true)}
                message={(
                  <>
                    Please make sure you have read the details of <strong>Price Impact</strong> and <strong>Leverage Impact</strong> before taking further actions.
                  </>
                )}
                proceedButtonTitle={`Proceed Farming ${Number(this.bloc.leverage$.value).toFixed(1)} x`}
                onClick={() => this.bloc.addPosition()}
              />
            )
          })

          return
        }}
        className={cx("AddPositionPopup__farmButton", {
          "AddPositionPopup__farmButton--disabled": isDisabled,
        })}
      >
        Farm {Number(this.bloc.leverage$.value).toFixed(2)}x
      </button>
    )
  }

  getDebtTokenKlevaRewardsAPR = () => {
    const lendingTokenSupplyInfo = lendingTokenSupplyInfo$.value
    const borrowingAsset = this.bloc.borrowingAsset$.value

    return calcKlevaRewardsAPR({
      tokenPrices: tokenPrices$.value,
      lendingTokenSupplyInfo,
      borrowingAsset,
      debtTokens,
      klevaAnnualRewards: klevaAnnualRewards$.value,
      klevaTokenPrice: tokenPrices$.value[tokenList.KLEVA.address.toLowerCase()],
      leverage: this.bloc.leverage$.value,
      borrowingDelta: new BigNumber(this.bloc.getAmountToBorrow()).div(10 ** this.bloc.baseToken$.value?.decimals).toNumber()
    })
  }
    
  render() {
    const { 
      title, 
      yieldFarmingAPR,
      tradingFeeAPR,
      borrowingAvailableAssets,

      token1,
      token2,
      workerInfo,
    } = this.props  

    const ibToken = getIbTokenFromOriginalToken(this.bloc.borrowingAsset$.value)

    const farmingToken = isSameAddress(this.bloc.borrowingAsset$.value?.address, token1?.address) 
      ? token2
      : token1

    const baseToken = isSameAddress(this.bloc.borrowingAsset$.value?.address, token1?.address)
      ? token1
      : token2

    const workerConfig = workerInfo &&
      workerInfo[this.bloc.worker$.value.workerAddress.toLowerCase()] || workerInfo[this.bloc.worker$.value.workerAddress]

    const leverageCap = getBufferedLeverage(workerConfig.workFactorBps)

    // APR Before
    const before_yieldFarmingAPR = yieldFarmingAPR
    const before_tradingFeeAPR = tradingFeeAPR
    const before_klevaRewardsAPR = 0
    const before_borrowingInterestAPR = 0

    const before_totalAPR = new BigNumber(before_yieldFarmingAPR)
      .plus(before_tradingFeeAPR)
      .plus(before_klevaRewardsAPR) // klevaRewards
      .minus(before_borrowingInterestAPR) // borrowingInterest
      .toNumber()

    // APR After
    const after_yieldFarmingAPR = new BigNumber(before_yieldFarmingAPR)
      .multipliedBy(this.bloc.leverage$.value)
      .toNumber()

    const after_tradingFeeAPR = new BigNumber(before_tradingFeeAPR)
      .multipliedBy(this.bloc.leverage$.value)
      .toNumber()

    const after_klevaRewardsAPR = this.getDebtTokenKlevaRewardsAPR()

    const borrowingInfo = lendingTokenSupplyInfo$.value && lendingTokenSupplyInfo$.value[this.bloc.borrowingAsset$.value && this.bloc.borrowingAsset$.value.address.toLowerCase()]

    const ibBorrowingInfo = addressKeyFind(lendingTokenSupplyInfo$.value, ibToken.address)

    // const borrowingDelta = new BigNumber(this.bloc.getAmountToBorrow())
    //   .div(10 ** this.bloc.baseToken$.value?.decimals)
    //   .toNumber()

    // const newBorrowingInterest = calcInterestRate(
    //   new BigNumber(ibBorrowingInfo?.totalBorrowed).plus(borrowingDelta),
    //   ibBorrowingInfo?.totalSupply - new BigNumber(ibBorrowingInfo?.totalBorrowed).plus(borrowingDelta)
    // )

    const after_borrowingInterestAPR = borrowingInfo
      && new BigNumber(borrowingInfo.borrowingInterest)
        .multipliedBy(this.bloc.leverage$.value - 1)
        .toNumber()

    const after_totalAPR = new BigNumber(after_yieldFarmingAPR)
      .plus(after_tradingFeeAPR)
      .plus(after_klevaRewardsAPR)
      .minus(after_borrowingInterestAPR)
      .toNumber()

    const borrowingAmount = new BigNumber(this.bloc.getAmountToBorrow())
      .div(10 ** baseToken.decimals)
      .toNumber()

    const farmingTokenAmountInBaseToken = this.bloc.farmingTokenAmountInBaseToken$.value

    return (
      <Modal ref={this.$baseElem} className={cx("AddPositionPopup__modal", {
        "AddPositionPopup__modal--dim": !!layeredModalContentComponent$.value
      })} title={title}>
        {this.bloc.showAPRDetail$.value && (
          <APRAPYDetailed 
            showDetail$={this.bloc.showAPRDetail$}
            
            totalAPRBefore={before_totalAPR}
            totalAPRAfter={after_totalAPR}

            yieldFarmingBefore={before_yieldFarmingAPR}
            yieldFarmingAfter={after_yieldFarmingAPR}
            tradingFeeBefore={before_tradingFeeAPR}
            tradingFeeAfter={after_tradingFeeAPR}

            klevaRewardsAPRBefore={before_klevaRewardsAPR}
            klevaRewardsAPRAfter={after_klevaRewardsAPR}

            borrowingInterestAPRBefore={before_borrowingInterestAPR}
            borrowingInterestAPRAfter={after_borrowingInterestAPR}
          />
        )}
        <div className="AddPositionPopup">
          <div className="AddPositionPopup__content">
            <APRAPYBrief 
              totalAPRBefore={before_totalAPR}
              totalAPRAfter={after_totalAPR}

              yieldFarmingBefore={before_yieldFarmingAPR}
              yieldFarmingAfter={after_yieldFarmingAPR}
              tradingFeeBefore={before_tradingFeeAPR}
              tradingFeeAfter={after_tradingFeeAPR}

              klevaRewardsAPRBefore={before_klevaRewardsAPR}
              klevaRewardsAPRAfter={after_klevaRewardsAPR}

              borrowingInterestAPRBefore={before_borrowingInterestAPR}
              borrowingInterestAPRAfter={after_borrowingInterestAPR}
            
              showDetail$={this.bloc.showAPRDetail$}
            />
            <div className="AddPositionPopup__controller">
              <SupplyingAssets
                balances={balancesInWallet$.value}

                farmingToken={farmingToken}
                baseToken={baseToken}

                farmingTokenAmount$={this.bloc.farmingTokenAmount$}
                baseTokenAmount$={this.bloc.baseTokenAmount$}
              />
              <LeverageGauge 
                leverage$={this.bloc.leverage$}
                leverageCap={leverageCap}
              />
              <BorrowingAssets
                items={borrowingAvailableAssets}
                selectedItem={this.bloc.borrowingAsset$.value}
                onSelect={this.bloc.selectBorrowingAsset}
              />
              <div className="AddPositionPopup__aware">
                <img className="AddPositionPopup__awareIcon" src="/static/images/warn.svg" />
                <span className="AddPositionPopup__awareMessage">Please be aware that a swap will match the ratio of owned assets to borrowing assets to 5:5</span>
              </div>
            </div>
          </div>
        </div>
        {this.bloc.showSummary$.value && (
          <AddPositionPopupSummary
            showDetail$={this.bloc.showSummary$}
            baseToken={this.bloc.baseToken$.value}
            farmingToken={this.bloc.farmingToken$.value}
            farmingTokenAmount={this.bloc.farmingTokenAmount$.value}
            baseTokenAmount={this.bloc.baseTokenAmount$.value}
            borrowingAmount={borrowingAmount}
            priceImpact={this.bloc.priceImpact$.value}
            leverageImpact={this.bloc.leverageImpact$.value}
            afterPositionValue={this.bloc.afterPositionValue$.value}
          />
        )}
        <Checkbox
          className="AddPositionPopup__summaryCheckbox"
          label="Summary"
          checked$={this.bloc.showSummary$}
        />
        {!this.bloc.isDebtSizeValid$.value && (
          <p className="AddPositionPopup__minDebtSize">
            Minimum Debt Size: {nFormatter(new BigNumber(ibToken.minDebtSize).div(10 ** ibToken.decimals).toNumber(), 2)} {this.bloc.borrowingAsset$.value?.title}
          </p>
        )}
        {this.renderButton()}
      </Modal>
    )
  }
}

export default AddPositionPopup