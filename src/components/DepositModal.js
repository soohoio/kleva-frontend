import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import BigNumber from 'bignumber.js'
import { Subject, merge } from 'rxjs'
import { distinctUntilChanged, takeUntil, tap } from 'rxjs/operators'

import { balancesInWallet$, allowancesInLendingPool$ } from 'streams/wallet'

import InputWithPercentage from './common/InputWithPercentage'

import Modal from './common/Modal'
import Bloc from './DepositModal.bloc'

import './DepositModal.scss'
import { isValidDecimal } from '../utils/calc'

class DepositModal extends Component {
  destroy$ = new Subject()

  bloc = new Bloc()
  
  componentDidMount() {
    const { stakingToken } = this.props

    merge(
      this.bloc.depositAmount$,
      this.bloc.isLoading$,
      balancesInWallet$.pipe(
        distinctUntilChanged((a, b) => 
          (a[stakingToken.address] && a[stakingToken.address].balanceParsed) === 
          (b[stakingToken.address] && b[stakingToken.address].balanceParsed)
        )
      ),
      allowancesInLendingPool$,
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }

  renderButton = () => {

    const { vaultAddress, stakingToken } = this.props

    const isApproved = stakingToken.nativeCoin || (allowancesInLendingPool$.value && allowancesInLendingPool$.value[vaultAddress] != 0)

    if (this.bloc.isLoading$.value) {
      return (
        <button
          className="DepositModal__confirmButton"
        >
          ...
        </button>
      )
    }

    if (isApproved) {

      const availableBalance = balancesInWallet$.value[stakingToken.address] &&
        balancesInWallet$.value[stakingToken.address].balanceParsed

      const isDisabled = !this.bloc.depositAmount$.value
        || new BigNumber(this.bloc.depositAmount$.value).lte(0)
        || new BigNumber(this.bloc.depositAmount$.value).gt(availableBalance)
        || !isValidDecimal(this.bloc.depositAmount$.value, stakingToken.decimals)

      return (
        <button
          onClick={() => {
            if (isDisabled) return
            this.bloc.deposit(stakingToken, vaultAddress)
          }}
          className={cx("DepositModal__confirmButton", {
            "DepositModal__confirmButton--disabled": isDisabled,
          })}
        >
          Confirm
        </button>
      )
    }

    return (
      <button
        onClick={() => this.bloc.approve(stakingToken, vaultAddress)}
        className="DepositModal__confirmButton"
      >
        Approve
      </button>
    )
  }
    
  render() {
    const { vaultAddress, stakingToken, ibTokenPrice } = this.props
    const availableBalance = balancesInWallet$.value[stakingToken.address] &&
      balancesInWallet$.value[stakingToken.address].balanceParsed

    const willReceiveAmount = (ibTokenPrice && this.bloc.depositAmount$.value)
      ? new BigNumber(this.bloc.depositAmount$.value).div(ibTokenPrice).toNumber().toLocaleString('en-us', { maximumFractionDigits: 4 })
      : "0.00"

    const isApproved = stakingToken.nativeCoin || (allowancesInLendingPool$.value && allowancesInLendingPool$.value[vaultAddress] != 0)

    return (
      <Modal title="Deposit">
          <div className="DepositModal__available">
            <span className="DepositModal__availableLabel">Available Balance: </span>
          <span className="DepositModal__availableAmount">{Number(availableBalance).toLocaleString('en-us', { maximumFractionDigits: 4})} {stakingToken.title}</span>
          </div>
          <InputWithPercentage
            className="DepositModal__depositInput"
            decimalLimit={stakingToken.decimals}
            value$={this.bloc.depositAmount$}
            valueLimit={availableBalance}
            label={stakingToken.title}
          />
          <p className="DepositModal__youWillReceive">You will receive:</p>
          <div className="DepositModal__bottom">
            <div className="DepositModal__receive">
              <span className="DepositModal__receiveAmount">~{willReceiveAmount}</span>
              <span className="DepositModal__receiveToken">ib{stakingToken.title}</span>
            </div>
            {this.renderButton()}
          </div>
      </Modal>
    )
  }
}

export default DepositModal