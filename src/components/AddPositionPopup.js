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
import { poolReserves$ } from '../streams/farming'
import { tokenList } from '../constants/tokens'

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
      this.bloc.borrowingAmount$,
      this.bloc.priceImpact$,
      this.bloc.worker$,
      this.bloc.leverage$,
      this.bloc.farmingTokenAmountInBaseToken$,
      balancesInWallet$,
      merge(
        this.bloc.farmingTokenAmount$.pipe(
          tap(() => {
            this.bloc.calcFarmingTokenAmountInBaseToken()
          })
        ),
        this.bloc.baseTokenAmount$,
      ).pipe(
        tap(() => {
          this.bloc.getPriceImpact(poolReserves$.value)
        })
      ),
      poolReserves$,
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
        console.log(worker, '@worker')
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
  
  componentWillUnMount() {
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
    
  render() {
    const { 
      title, 
      leverage, 
      onSelect,
      yieldFarmingAPR,
      tradingFeeAPR,
      borrowingAvailableAssets,

      token1,
      token2,
      workerInfo,
    } = this.props  

    const totalAPR = new BigNumber(yieldFarmingAPR)
      .plus(tradingFeeAPR)
      .plus(0) // klevaRewards
      .minus(0) // borrowingInterest
      .toNumber()

    const APY = toAPY(totalAPR)

    const farmingToken = (this.bloc.borrowingAsset$.value && this.bloc.borrowingAsset$.value.address.toLowerCase()) === token1.address.toLowerCase()
        ? token2
        : token1
    
    const baseToken = (this.bloc.borrowingAsset$.value && this.bloc.borrowingAsset$.value.address.toLowerCase()) === token1.address.toLowerCase()
        ? token1
        : token2

    const workerConfig = workerInfo && 
      workerInfo[this.bloc.worker$.value.workerAddress.toLowerCase()] || workerInfo[this.bloc.worker$.value.workerAddress]

    const leverageCap = 10000 / (10000 - workerConfig.workFactorBps)

    return (
      <Modal className="AddPositionPopup__modal" title={title}>
        <div className="AddPositionPopup">
          <div className="AddPositionPopup__content">
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
            <div className="AddPositionPopup__summary">
              <FarmSummary

                farmingToken={farmingToken}
                baseToken={baseToken}

                yieldFarmingBefore={yieldFarmingAPR}
                yieldFarmingAfter={yieldFarmingAPR}
                tradingFeeBefore={tradingFeeAPR}
                tradingFeeAfter={tradingFeeAPR}
                klevaRewardAPR={0}
                borrowingInterestAPR={0}
                farmingTokenSupplied={this.bloc.farmingTokenAmount$.value}
                baseTokenSupplied={this.bloc.baseTokenAmount$.value || 0}
                priceImpact={this.bloc.priceImpact$.value}
                farmingTokenPositionValue={this.bloc.farmingTokenAmount$.value}
                baseTokenPositionValue={this.bloc.baseTokenAmount$.value || 0}

                borrowingAsset={this.bloc.borrowingAsset$.value}
                borrowingAmount={this.bloc.borrowingAmount$.value}

                totalAPRBefore={totalAPR}
                totalAPYBefore={APY}
                totalAPRAfter={totalAPR}
                totalAPYAfter={APY}
              />
            </div>
          </div>
          {this.renderButton()}
        </div>
      </Modal>
    )
  }
}

export default AddPositionPopup