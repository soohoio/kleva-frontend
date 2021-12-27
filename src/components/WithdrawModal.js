import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import BigNumber from 'bignumber.js'
import { Subject, merge } from 'rxjs'
import { distinctUntilChanged, takeUntil, tap } from 'rxjs/operators'

import { balancesInWallet$ } from 'streams/wallet'

import InputWithPercentage from './common/InputWithPercentage'
import Modal from './common/Modal'
import Bloc from './WithdrawModal.bloc'

import './WithdrawModal.scss'

class WithdrawModal extends Component {
  destroy$ = new Subject()

  bloc = new Bloc()

  componentDidMount() {
    const { stakingToken, vaultAddress } = this.props

    merge(
      this.bloc.withdrawAmount$,
      this.bloc.isLoading$,
      balancesInWallet$.pipe(
        distinctUntilChanged((a, b) =>
          (a[vaultAddress] && a[vaultAddress].balanceParsed) ===
          (b[vaultAddress] && b[vaultAddress].balanceParsed)
        )
      ),
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })
  }

  componentWillUnMount() {
    this.destroy$.next(true)
  }

  render() {
    const { vaultAddress, stakingToken, ibTokenPrice } = this.props

    const realTokenPrice = 1 / ibTokenPrice

    const availableBalance = balancesInWallet$.value[vaultAddress] &&
      balancesInWallet$.value[vaultAddress].balanceParsed

    const willReceiveAmount = (ibTokenPrice && this.bloc.withdrawAmount$.value)
      ? new BigNumber(this.bloc.withdrawAmount$.value).div(realTokenPrice).toNumber().toLocaleString('en-us', { maximumFractionDigits: 4 })
      : "0.00"

    const isDisabled = !this.bloc.withdrawAmount$.value
      || new BigNumber(this.bloc.withdrawAmount$.value).lte(0)
      || new BigNumber(this.bloc.withdrawAmount$.value).gt(availableBalance)

    return (
      <Modal title="Withdraw">
        <div className="WithdrawModal__available">
          <span className="WithdrawModal__availableLabel">Available Balance: </span>
          <span className="WithdrawModal__availableAmount">{Number(availableBalance).toLocaleString('en-us', { maximumFractionDigits: 4 })} ib{stakingToken.title}</span>
        </div>
        <InputWithPercentage
          className="WithdrawModal__withdrawInput"
          value$={this.bloc.withdrawAmount$}
          valueLimit={availableBalance}
          label={stakingToken.title}
        />
        <p className="WithdrawModal__youWillReceive">You will receive</p>
        <div className="WithdrawModal__bottom">
          <div className="WithdrawModal__receive">
            <span className="WithdrawModal__receiveAmount">~{willReceiveAmount}</span>
            <span className="WithdrawModal__receiveToken">{stakingToken.title}</span>
          </div>
          <button
            onClick={() => {
              if (isDisabled) return
              this.bloc.withdraw(stakingToken, vaultAddress)
            }}
            className={cx("WithdrawModal__confirmButton", {
              "WithdrawModal__confirmButton--disabled": isDisabled,
            })}
          >
            {this.bloc.isLoading$.value ? "..." : "Confirm"}
          </button>
        </div>
      </Modal>
    )
  }
}

export default WithdrawModal