import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import BigNumber from 'bignumber.js'
import { Subject, merge } from 'rxjs'
import { debounceTime, distinctUntilChanged, takeUntil, tap } from 'rxjs/operators'

import { balancesInWallet$, allowancesInLendingPool$ } from 'streams/wallet'

import InputWithPercentage from './common/InputWithPercentage'

import Modal from './common/Modal'
import Bloc from './DepositModal.bloc'

import './DepositModal.scss'
import { isValidDecimal } from '../utils/calc'
import { tokenList } from '../constants/tokens'
import { isSameAddress } from '../utils/misc'

class DepositModal extends Component {
  destroy$ = new Subject()

  bloc = new Bloc()
  
  componentDidMount() {
    const { stakingToken } = this.props

    merge(
      this.bloc.depositAmount$,
      this.bloc.klayAmountToWrap$,
      this.bloc.isWrapping$,
      this.bloc.isLoading$,
      balancesInWallet$.pipe(
        distinctUntilChanged((a, b) => 
          (a[stakingToken.address] && a[stakingToken.address].balanceParsed) === 
          (b[stakingToken.address] && b[stakingToken.address].balanceParsed)
        )
      ),
      allowancesInLendingPool$,
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

  renderButton = () => {

    let { vaultAddress, stakingToken } = this.props

    // const isApproved = stakingToken.nativeCoin || (allowancesInLendingPool$.value && allowancesInLendingPool$.value[vaultAddress] != 0)
    const isApproved = (allowancesInLendingPool$.value && allowancesInLendingPool$.value[vaultAddress] != 0)

    const isKLAY = isSameAddress(stakingToken.address, tokenList.KLAY.address)

    if (isKLAY) {
      stakingToken = tokenList.WKLAY
    }

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
        // || isSameAddress(stakingToken.address, tokenList.KUSDT.address)

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

  renderWKLAYStep = () => {
    const { vaultAddress, stakingToken, ibTokenPrice } = this.props
    const availableBalance = balancesInWallet$.value[stakingToken.address] &&
      balancesInWallet$.value[stakingToken.address].balanceParsed

    const availableWKLAYBalance = balancesInWallet$.value[tokenList.WKLAY.address] &&
      balancesInWallet$.value[tokenList.WKLAY.address].balanceParsed

    const willReceiveAmount = (ibTokenPrice && this.bloc.depositAmount$.value)
      ? new BigNumber(this.bloc.depositAmount$.value).div(ibTokenPrice).toNumber().toLocaleString('en-us', { maximumFractionDigits: 4 })
      : "0.00"

    return (
      <>
        <p className="DepositModal__stepTitle">Step 1: Wrap KLAY</p>
        <div className="DepositModal__available">
          <span className="DepositModal__availableLabel">Available Balance: </span>
          <span className="DepositModal__availableAmount">{Number(availableBalance).toLocaleString('en-us', { maximumFractionDigits: 4 })} {stakingToken.title}</span>
        </div>
        <InputWithPercentage
          className="DepositModal__depositInput"
          decimalLimit={stakingToken.decimals}
          value$={this.bloc.klayAmountToWrap$}
          valueLimit={availableBalance}
          label={stakingToken.title}
          targetToken={stakingToken}
        />
        <p className="DepositModal__youWillReceive">You will receive:</p>
        <div className="DepositModal__bottom">
          <div className="DepositModal__receive">
            <span className="DepositModal__receiveAmount">{this.bloc.klayAmountToWrap$.value}</span>
            <span className="DepositModal__receiveToken">WKLAY</span>
          </div>
          {this.bloc.isWrapping$.value 
            ? (
              <button
                className="DepositModal__wrapButton"
              >
                ...
              </button>
            )
            : (
              <button
                onClick={() => this.bloc.wrapKLAY()}
                className="DepositModal__wrapButton"
              >
                Wrap
              </button>
            )
          }
        </div>
        <hr className="DepositModal__hr" />
        <p className="DepositModal__stepTitle">Step 2: Deposit WKLAY</p>
        <div className="DepositModal__available">
          <span className="DepositModal__availableLabel">Available Balance: </span>
          <span className="DepositModal__availableAmount">{Number(availableWKLAYBalance).toLocaleString('en-us', { maximumFractionDigits: 4 })} WKLAY</span>
        </div>
        <InputWithPercentage
          className="DepositModal__depositInput"
          decimalLimit={stakingToken.decimals}
          value$={this.bloc.depositAmount$}
          valueLimit={availableBalance}
          label="WKLAY"
          targetToken={stakingToken}
        />
        <p className="DepositModal__youWillReceive">You will receive:</p>
        <div className="DepositModal__bottom">
          <div className="DepositModal__receive">
            <span className="DepositModal__receiveAmount">~{willReceiveAmount}</span>
            <span className="DepositModal__receiveToken">ib{stakingToken.title}</span>
          </div>
          {this.renderButton()}
        </div>
      </>
    )
  }
    
  render() {
    const { vaultAddress, stakingToken, ibTokenPrice } = this.props
    const availableBalance = balancesInWallet$.value[stakingToken.address] &&
      balancesInWallet$.value[stakingToken.address].balanceParsed

    const willReceiveAmount = (ibTokenPrice && this.bloc.depositAmount$.value)
      ? new BigNumber(this.bloc.depositAmount$.value).div(ibTokenPrice).toNumber().toLocaleString('en-us', { maximumFractionDigits: 4 })
      : "0.00"

    const isKLAY = isSameAddress(stakingToken.address, tokenList.KLAY.address)

    return (
      <Modal title="Deposit">
          {isKLAY 
            ? this.renderWKLAYStep()
            : (
              <>
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
                  targetToken={stakingToken}
                />
                <p className="DepositModal__youWillReceive">You will receive:</p>
                <div className="DepositModal__bottom">
                  <div className="DepositModal__receive">
                    <span className="DepositModal__receiveAmount">~{willReceiveAmount}</span>
                    <span className="DepositModal__receiveToken">ib{stakingToken.title}</span>
                  </div>
                  {this.renderButton()}
                </div>
              </>
            )
          }
      </Modal>
    )
  }
}

export default DepositModal