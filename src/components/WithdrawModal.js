import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import BigNumber from 'bignumber.js'
import { Subject, merge } from 'rxjs'
import { debounceTime, distinctUntilChanged, takeUntil, tap } from 'rxjs/operators'

import { balancesInWallet$ } from 'streams/wallet'

import InputWithPercentage from './common/InputWithPercentage'
import Modal from './common/Modal'
import Bloc from './WithdrawModal.bloc'

import './WithdrawModal.scss'
import { isValidDecimal } from '../utils/calc'
import { isSameAddress } from '../utils/misc'
import { getOriginalTokenFromIbToken, tokenList } from '../constants/tokens'

class WithdrawModal extends Component {
  destroy$ = new Subject()

  bloc = new Bloc()

  componentDidMount() {
    const { stakingToken, vaultAddress } = this.props

    merge(
      this.bloc.withdrawAmount$,
      this.bloc.klayAmountToUnwrap$,
      this.bloc.isLoading$,
      this.bloc.isUnwrapping$,
      balancesInWallet$.pipe(
        distinctUntilChanged((a, b) => {
          return (a[vaultAddress]?.balanceParsed) === (b[vaultAddress]?.balanceParsed) && (a[tokenList.WKLAY.address]?.balanceParsed) === (b[tokenList.WKLAY.address]?.balanceParsed)
        })
      ),
    ).pipe(
      debounceTime(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })
  }

  componentWillUnmount() {
    this.destroy$.next(true)
  }

  renderWKLAYStep = () => {

    const { vaultAddress, stakingToken, ibTokenPrice } = this.props

    const realTokenPrice = 1 / ibTokenPrice

    const availableBalance = balancesInWallet$.value[vaultAddress] &&
      balancesInWallet$.value[vaultAddress].balanceParsed

    const availableWKLAYBalance = balancesInWallet$.value[tokenList.WKLAY.address] &&
      balancesInWallet$.value[tokenList.WKLAY.address].balanceParsed

    const willReceiveWKLAYAmount = this.bloc.klayAmountToUnwrap$.value

    const willReceiveAmount = (ibTokenPrice && this.bloc.withdrawAmount$.value)
      ? new BigNumber(this.bloc.withdrawAmount$.value).div(realTokenPrice).toNumber().toLocaleString('en-us', { maximumFractionDigits: 4 })
      : "0.00"

    const isDisabled = !this.bloc.withdrawAmount$.value
      || new BigNumber(this.bloc.withdrawAmount$.value).lte(0)
      || new BigNumber(this.bloc.withdrawAmount$.value).gt(availableBalance)
      || !isValidDecimal(this.bloc.withdrawAmount$.value, stakingToken.decimals)
    // || isSameAddress(stakingToken.address, tokenList.KUSDT.address)

    const isUnwrapDisabled = !this.bloc.klayAmountToUnwrap$.value
      || new BigNumber(this.bloc.klayAmountToUnwrap$.value).lte(0)
      || new BigNumber(this.bloc.klayAmountToUnwrap$.value).gt(availableBalance)
      || !isValidDecimal(this.bloc.klayAmountToUnwrap$.value, stakingToken.decimals)

    const originalToken = getOriginalTokenFromIbToken(stakingToken)

    return (
      <>
        <div className="WithdrawModal__available">
          <span className="WithdrawModal__availableLabel">Available Balance: </span>
          <span className="WithdrawModal__availableAmount">{Number(availableBalance).toLocaleString('en-us', { maximumFractionDigits: 4 })} {stakingToken.title}</span>
        </div>
        <InputWithPercentage
          decimalLimit={stakingToken.decimals}
          className="WithdrawModal__withdrawInput"
          value$={this.bloc.withdrawAmount$}
          valueLimit={availableBalance}
          label={stakingToken.title}
          targetToken={stakingToken}
        />
        <p className="WithdrawModal__youWillReceive">You will receive</p>
        <div className="WithdrawModal__bottom">
          <div className="WithdrawModal__receive">
            <span className="WithdrawModal__receiveAmount">~{willReceiveAmount}</span>
            <span className="WithdrawModal__receiveToken">{originalToken.title}</span>
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

        <hr className="DepositModal__hr" />
        <p className="DepositModal__stepTitle">Optional: Unwrap WKLAY</p>

        <div className="DepositModal__available">
          <span className="DepositModal__availableLabel">Available Balance: </span>
          <span className="DepositModal__availableAmount">{Number(availableWKLAYBalance).toLocaleString('en-us', { maximumFractionDigits: 4 })} WKLAY</span>
        </div>
        <InputWithPercentage
          className="DepositModal__depositInput"
          decimalLimit={stakingToken.decimals}
          value$={this.bloc.klayAmountToUnwrap$}
          valueLimit={availableBalance}
          label={"WKLAY"}
          targetToken={stakingToken}
        />
        <p className="DepositModal__youWillReceive">You will receive:</p>
        <div className="DepositModal__bottom">
          <div className="DepositModal__receive">
            <span className="DepositModal__receiveAmount">{this.bloc.klayAmountToUnwrap$.value}</span>
            <span className="DepositModal__receiveToken">KLAY</span>
          </div>
          {this.bloc.isUnwrapping$.value
            ? (
              <button
                className="DepositModal__wrapButton"
              >
                ...
              </button>
            )
            : (
              <button
                onClick={() => {
                  if (isUnwrapDisabled) return
                  this.bloc.unwrapWKLAY()
                }}
                className={cx("DepositModal__wrapButton", {
                  "DepositModal__wrapButton--disabled": isUnwrapDisabled,
                })}
              >
                Unwrap
              </button>
            )
          }
        </div>
      </>
    )
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
      || !isValidDecimal(this.bloc.withdrawAmount$.value, stakingToken.decimals)
      // || isSameAddress(stakingToken.address, tokenList.KUSDT.address)

    const originalToken = getOriginalTokenFromIbToken(stakingToken)

    const isKLAY = isSameAddress(originalToken.address, tokenList.KLAY.address)

    return (
      <Modal title="Withdraw">
        {isKLAY
          ? this.renderWKLAYStep()
          : (
            <>
              <div className="WithdrawModal__available">
                <span className="WithdrawModal__availableLabel">Available Balance: </span>
                <span className="WithdrawModal__availableAmount">{Number(availableBalance).toLocaleString('en-us', { maximumFractionDigits: 4 })} {stakingToken.title}</span>
              </div>
              <InputWithPercentage
                decimalLimit={stakingToken.decimals}
                className="WithdrawModal__withdrawInput"
                value$={this.bloc.withdrawAmount$}
                valueLimit={availableBalance}
                label={stakingToken.title}
                targetToken={stakingToken}
              />
              <p className="WithdrawModal__youWillReceive">You will receive</p>
              <div className="WithdrawModal__bottom">
                <div className="WithdrawModal__receive">
                  <span className="WithdrawModal__receiveAmount">~{willReceiveAmount}</span>
                  <span className="WithdrawModal__receiveToken">{originalToken.title}</span>
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
            </>
          )
        }
      </Modal>
    )
  }
}

export default WithdrawModal