import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import BigNumber from 'bignumber.js'
import { Subject, merge } from 'rxjs'
import { distinctUntilChanged, takeUntil, tap } from 'rxjs/operators'

import { balancesInWallet$ } from 'streams/wallet'

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

    return (
      <Modal title="Withdraw">
        <div className="WithdrawModal__available">
          <span className="WithdrawModal__availableLabel">Available Balance: </span>
          <span className="WithdrawModal__availableAmount">{Number(availableBalance).toLocaleString('en-us', { maximumFractionDigits: 4 })} ib{stakingToken.title}</span>
        </div>
        <div
          className={cx('WithdrawModal__inputWrapper', {
            'WithdrawModal__inputWrapper--active': !!this.bloc.withdrawAmount$.value,
          })}>
          <input
            autoFocus
            value={this.bloc.withdrawAmount$.value}
            onChange={this.bloc.handleChange}
            placeholder="0.00"
            className="WithdrawModal__input"
          />
          <span className="WithdrawModal__inputLabel">ib{stakingToken.title}</span>
        </div>
        <div className="WithdrawModal__percentage">
          {[25, 50, 75, 100].map((p) => (
            <div
              onClick={() => {
                this.bloc.handleChange({
                  target: {
                    value: new BigNumber(availableBalance).multipliedBy(p / 100).toNumber()
                  }
                })
              }}
              className="WithdrawModal__percentageItem"
            >
              {p}%
            </div>
          ))}
        </div>
        <p className="WithdrawModal__youWillReceive">You will receive:</p>
        <div className="WithdrawModal__bottom">
          <div className="WithdrawModal__receive">
            <span className="WithdrawModal__receiveAmount">~{willReceiveAmount}</span>
            <span className="WithdrawModal__receiveToken">{stakingToken.title}</span>
          </div>
          <button
            onClick={() => this.bloc.withdraw(stakingToken, vaultAddress)}
            className="WithdrawModal__confirmButton"
          >
            Confirm
            </button>
        </div>
      </Modal>
    )
  }
}

export default WithdrawModal