import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import BigNumber from 'bignumber.js'
import { Subject, merge } from 'rxjs'
import { distinctUntilChanged, takeUntil, tap } from 'rxjs/operators'

import { balancesInWallet$, allowancesInLendingPool$ } from 'streams/wallet'

import Modal from './common/Modal'
import Bloc from './DepositModal.bloc'

import './DepositModal.scss'

class DepositModal extends Component {
  destroy$ = new Subject()

  bloc = new Bloc()
  
  componentDidMount() {
    const { stakingToken } = this.props

    merge(
      this.bloc.depositAmount$,
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
  
  componentWillUnMount() {
    this.destroy$.next(true)
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
          <div
          className={cx('DepositModal__inputWrapper', {
            'DepositModal__inputWrapper--active': !!this.bloc.depositAmount$.value,
          })}>
            <input 
              autoFocus
              value={this.bloc.depositAmount$.value}
              onChange={this.bloc.handleChange}
              placeholder="0.00"
              className="DepositModal__input" 
            />
            <span className="DepositModal__inputLabel">{stakingToken.title}</span>
          </div>
          <div className="DepositModal__percentage">
            {[25, 50, 75, 100].map((p) => (
              <div
                onClick={() => {
                  this.bloc.handleChange({ 
                    target: {
                      value: new BigNumber(availableBalance).multipliedBy(p / 100).toNumber() 
                    }
                  })
                }}
                className="DepositModal__percentageItem"
              >
                {p}%
              </div>
            ))}
          </div>
          <p className="DepositModal__youWillReceive">You will receive:</p>
          <div className="DepositModal__bottom">
            <div className="DepositModal__receive">
              <span className="DepositModal__receiveAmount">~{willReceiveAmount}</span>
              <span className="DepositModal__receiveToken">ib{stakingToken.title}</span>
            </div>
            {isApproved 
              ? (
                <button
                  onClick={() => this.bloc.deposit(stakingToken, vaultAddress)}
                  className="DepositModal__confirmButton"
                >
                  Confirm
                </button>
              )
              : (
                <button
                  onClick={() => this.bloc.approve(stakingToken, vaultAddress)}
                  className="DepositModal__confirmButton"
                >
                  Approve
                </button>
              )
            }
          </div>
      </Modal>
    )
  }
}

export default DepositModal