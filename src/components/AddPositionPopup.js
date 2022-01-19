import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, switchMap } from 'rxjs/operators'
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
import { toAPY } from '../utils/calc'
import { lendingPools, lendingPoolsByStakingTokenAddress } from '../constants/lendingpool'
import { checkAllowances$ } from '../streams/contract'
import { klevaAnnualRewards$, poolReserves$ } from '../streams/farming'
import { debtTokens, getIbTokenFromOriginalToken, tokenList } from '../constants/tokens'
import { tokenPrices$ } from '../streams/tokenPrice'
import APRAPYBrief from './APRAPYBrief'
import APRAPYDetailed from './APRAPYDetailed'
import Checkbox from './common/Checkbox'
import AddPositionPopupSummary from './AddPositionPopupSummary'

class AddPositionPopup extends Component {
  destroy$ = new Subject()

  constructor(props) {
    super(props)
    this.bloc = new Bloc(props)
  }
  
  componentDidMount() {
    merge(
      selectedAddress$,
      this.bloc.allowances$,
      this.bloc.borrowingAsset$,
      this.bloc.priceImpact$,
      this.bloc.worker$,
      this.bloc.farmingTokenAmountInBaseToken$,
      this.bloc.afterPositionValue$,
      
      this.bloc.showAPRDetail$,
      this.bloc.showSummary$,

      lendingTokenSupplyInfo$,
      tokenPrices$,
      klevaAnnualRewards$,
      balancesInWallet$,
      poolReserves$,
      merge(
        this.bloc.farmingTokenAmount$.pipe(
          tap(() => {
            this.bloc.calcFarmingTokenAmountInBaseToken$().subscribe()
          })
        ),
        this.bloc.baseTokenAmount$,
        this.bloc.leverage$,
      ).pipe(
        tap(() => {
          this.bloc.getAfterPositionValue()
          this.bloc.getPriceImpact(poolReserves$.value)

          // Check leverage available
          const { workerInfo } = this.props

          const positionValue = this.bloc.getPositionValue()
          const amountToBorrow = this.bloc.getAmountToBorrow()

          const newPositionValue = new BigNumber(positionValue).plus(amountToBorrow).toString()
          const newDebtValue = new BigNumber(amountToBorrow).toString()

          const workerConfig = workerInfo && workerInfo[this.bloc.worker$.value.workerAddress.toLowerCase()] || workerInfo[this.bloc.worker$.value.workerAddress]
          const workFactorBps = workerConfig && workerConfig.workFactorBps

          const a1 = new BigNumber(newPositionValue).multipliedBy(workFactorBps).toString()
          const a2 = new BigNumber(newDebtValue).multipliedBy(10 ** 4).toString()

          const _borrowMoreAvailable = new BigNumber(a1).isGreaterThan(a2)
          this.bloc.borrowMoreAvailable$.next(_borrowMoreAvailable)
        })
      ),
    ).pipe(
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

    const baseToken = this.bloc.baseToken$.value
    
    // KLAY -> WKLAY
    const isFarmingTokenKLAY = this.bloc.isKLAY(this.bloc.farmingToken$.value && this.bloc.farmingToken$.value.address)
    
    const farmingToken = isFarmingTokenKLAY 
      ? tokenList.WKLAY
      : this.bloc.farmingToken$.value

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

    const isDisabled = this.bloc.baseTokenAmount$.value == 0 
      && this.bloc.farmingTokenAmount$.value == 0
      || this.bloc.borrowMoreAvailable$.value == false

    return (
      <button
        onClick={() => {
          if (isDisabled) return
          
          this.bloc.addPosition()
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
      yieldFarmingAPR,
      tradingFeeAPR,
      borrowingAvailableAssets,

      token1,
      token2,
      workerInfo,
    } = this.props  

    const farmingToken = (this.bloc.borrowingAsset$.value && this.bloc.borrowingAsset$.value.address.toLowerCase()) === token1.address.toLowerCase()
      ? token2
      : token1

    const baseToken = (this.bloc.borrowingAsset$.value && this.bloc.borrowingAsset$.value.address.toLowerCase()) === token1.address.toLowerCase()
      ? token1
      : token2

    const workerConfig = workerInfo &&
      workerInfo[this.bloc.worker$.value.workerAddress.toLowerCase()] || workerInfo[this.bloc.worker$.value.workerAddress]

    const leverageCap = 10000 / (10000 - workerConfig.workFactorBps)

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
      <Modal className="AddPositionPopup__modal" title={title}>
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
            </div>
          </div>
          <Checkbox
            className="AddPositionPopup__summaryCheckbox"
            label="Summary"
            checked$={this.bloc.showSummary$}
          />
          {this.renderButton()}
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
            afterPositionValue={this.bloc.afterPositionValue$.value}
          />
        )}
      </Modal>
    )
  }
}

export default AddPositionPopup