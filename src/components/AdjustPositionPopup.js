import React, { Component, Fragment, createRef } from 'react'
import BigNumber from 'bignumber.js'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap, switchMap, filter } from 'rxjs/operators'

import SupplyingAssets from './SupplyingAssets'
import LeverageGauge from './LeverageGauge'
import BorrowMore from './BorrowMore'
import { balancesInWallet$, selectedAddress$ } from '../streams/wallet'

import Bloc from './AdjustPositionPopup.bloc'

import Modal from './common/Modal'

import './AdjustPositionPopup.scss'
import { tokenList } from '../constants/tokens'
import { borrowMore$, checkAllowances$ } from '../streams/contract'
import { positions$ } from '../streams/farming'

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

      this.bloc.farmingTokenAmount$,
      this.bloc.baseTokenAmount$,
      this.bloc.farmingTokenAmountInBaseToken$,
      this.bloc.leverage$,
      this.bloc.fetchAllowances$,
      this.bloc.borrowMore$,
      this.bloc.addCollateralAvailable$,
      this.bloc.borrowMoreAvailable$,
      
      this.bloc.equityValue$,
      this.bloc.debtValue$,

      merge(
        this.bloc.leverage$,
        positions$
      ).pipe(
        tap(() => {
          const positions = positions$.value
          const positionInfo = positions && positions.find(({ id }) => id == this.props.positionId)

          const positionValue = positionInfo && positionInfo.positionValue
          const debtValue = positionInfo && positionInfo.debtValue
          const equityValue = positionInfo && new BigNumber(positionInfo.positionValue).minus(debtValue)

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

          this.bloc.positionValue$.next(positionValueParsed)
          this.bloc.equityValue$.next(equityValueParsed)
          this.bloc.debtValue$.next(debtValueParsed)
          this.bloc.currentPositionLeverage$.next(currentPositionLeverage)

          if (!this.bloc.leverage$.value) {
            this.bloc.leverage$.next(this.bloc.currentPositionLeverage$.value)
          }

          const rawKillFactorBps = this.props.workerInfo && this.props.workerInfo.rawKillFactorBps
          const workFactorBps = this.props.workerInfo && this.props.workerInfo.workFactorBps

          // addCollateral available condition
          // (positionValue * rawKillFactor >= debtValue * 1e4)
          const _addCollateralAvailable = new BigNumber(positionValue)
            .multipliedBy(rawKillFactorBps)
            .gte(new BigNumber(debtValue).multipliedBy(10 ** 4))

          const _borrowMoreAvailable = new BigNumber(positionValue)
            .multipliedBy(workFactorBps)
            .gte(new BigNumber(debtValue).multipliedBy(10 ** 4))
          
          this.bloc.addCollateralAvailable$.next(_addCollateralAvailable)
          this.bloc.borrowMoreAvailable$.next(_borrowMoreAvailable)
        })
      ),
    ).pipe(
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

    const isAddCollateralDisabled = this.bloc.baseTokenAmount$.value == 0
      && this.bloc.farmingTokenAmount$.value == 0
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
        {/* Farm {Number(this.bloc.leverage$.value).toFixed(2)}x */}
      </button>
    )
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
    } = this.props

    return (
      <Modal className="AdjustPositionPopup__modal" title={title}>
        <div className="AdjustPositionPopup">
          <div className="AdjustPositionPopup__content">
            <div className="AdjustPositionPopup__controller">
              <SupplyingAssets
                title="Adding Collateral"
                balances={balancesInWallet$.value}

                farmingToken={farmingToken}
                baseToken={baseToken}

                farmingTokenAmount$={this.bloc.farmingTokenAmount$}
                baseTokenAmount$={this.bloc.baseTokenAmount$}
              />
              <BorrowMore
                equityValue={this.bloc.equityValue$.value}
                debtValue={this.bloc.debtValue$.value}
                borrowingAsset={baseToken}
                leverageCap={leverageCap}
                borrowMore$={this.bloc.borrowMore$}
                leverage$={this.bloc.leverage$}
              />
            </div>
            <div className="AdjustPositionPopup__summary">
            </div>
          </div>
          {this.renderButton()}
        </div>
      </Modal>
    )
  }
}

export default AdjustPositionPopup