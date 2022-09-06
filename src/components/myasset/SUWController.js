import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import BigNumber from 'bignumber.js'
import { BehaviorSubject, Subject, merge } from 'rxjs'
import { debounceTime, distinctUntilChanged, takeUntil, tap } from 'rxjs/operators'

import { balancesInWallet$, allowancesInStakingPool$ } from 'streams/wallet'


import InputWithPercentage from '../common/InputWithPercentage'

import Modal from '../common/Modal'
import Bloc from './SUWController.bloc'

import './SUWController.scss'
import { isValidDecimal } from '../../utils/calc'
import { tokenList } from '../../constants/tokens'
import { isSameAddress, noRounding } from '../../utils/misc'
import { I18n } from '../common/I18n'
import QuestionMark from '../common/QuestionMark'
import { stakingPoolsByToken } from '../../constants/stakingpool'
import { balancesInStakingPool$, selectedAddress$ } from '../../streams/wallet'
import { closeModal$ } from 'streams/ui';
import LabelAndValue from '../LabelAndValue'
import Tip from '../common/Tip'

class SUWController extends Component {
  destroy$ = new Subject()

  bloc = new Bloc()

  componentDidMount() {
    const { stakingToken } = this.props

    merge(
      this.bloc.stakeAmount$,
      this.bloc.unstakeAmount$,
      this.bloc.withdrawAmount$,
      this.bloc.wklayWithdrawCompleted$,
      this.bloc.wklayAmountToUnwrap$,
      this.bloc.isLoading$,
      selectedAddress$,
      balancesInWallet$.pipe(
        distinctUntilChanged((a, b) =>
          (a[stakingToken.address] && a[stakingToken.address].balanceParsed) ===
          (b[stakingToken.address] && b[stakingToken.address].balanceParsed)
        )
      ),
      balancesInStakingPool$,
      allowancesInStakingPool$,
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

    let { mode, stakingToken } = this.props

    if (this.bloc.isLoading$.value) {
      return (
        <button
          className="SUWController__confirmButton"
        >
          ...
        </button>
      )
    }

    // WKLAY Switch
    if (this.bloc.wklayWithdrawCompleted$.value) {

      const availableWKLAYBalance = balancesInWallet$.value[tokenList.WKLAY.address] 
        && balancesInWallet$.value[tokenList.WKLAY.address].balanceParsed

      const isSwitchDisabled = !this.bloc.wklayAmountToUnwrap$.value
        || new BigNumber(this.bloc.wklayAmountToUnwrap$.value).lte(0)
        || new BigNumber(this.bloc.wklayAmountToUnwrap$.value).gt(availableWKLAYBalance)
        || !isValidDecimal(this.bloc.wklayAmountToUnwrap$.value, tokenList.WKLAY.decimals)

      return (
        <>
          <button
            onClick={() => {
              if (isSwitchDisabled) return
              this.bloc.unwrapWKLAY()
            }}
            className={cx("SUWController__confirmButton", {
              "SUWController__confirmButton--disabled": isSwitchDisabled,
            })}
          >
            {I18n.t('convertTo', { title: "KLAY" })}
          </button>
        </>
      )
    }


    // Staking
    const isStakingApproved = (allowancesInStakingPool$.value && allowancesInStakingPool$.value[stakingToken.address] != 0)

    const availableStakingBalance = balancesInWallet$.value[stakingToken.address] &&
      balancesInWallet$.value[stakingToken.address].balanceParsed

    const isStakingDisabled = !this.bloc.stakeAmount$.value
      || new BigNumber(this.bloc.stakeAmount$.value).lte(0)
      || new BigNumber(this.bloc.stakeAmount$.value).gt(availableStakingBalance)
      || !isValidDecimal(this.bloc.stakeAmount$.value, stakingToken.decimals)

    const _stakingPool = stakingPoolsByToken[stakingToken.address]
    const _stakingPoolPID = _stakingPool && _stakingPool.pid

    if (mode === 'staking') {

      if (!isStakingApproved) {
        return (
          <button
            onClick={() => this.bloc.approveStaking(stakingToken)}
            className="SUWController__confirmButton"
          >
            {I18n.t('approve')}
          </button>
        )
      }

      return (
        <>
          <button
            onClick={() => {
              if (isStakingDisabled) return
              this.bloc.stake(stakingToken, _stakingPoolPID, selectedAddress$.value)
            }}
            className={cx("SUWController__confirmButton", {
              "SUWController__confirmButton--disabled": isStakingDisabled,
            })}
          >
            {I18n.t('myasset.staking')}
          </button>
        </>
      )
    }

    const availableUnstakingBalance = balancesInStakingPool$.value[stakingToken.address] &&
      balancesInStakingPool$.value[stakingToken.address].balanceParsed

    if (mode === 'unstaking') {

      const isUnstakingDiasabled = !this.bloc.unstakeAmount$.value
        || new BigNumber(this.bloc.unstakeAmount$.value).lte(0)
        || new BigNumber(this.bloc.unstakeAmount$.value).gt(availableUnstakingBalance)
        || !isValidDecimal(this.bloc.unstakeAmount$.value, stakingToken.decimals)

      return (
        <>
          <button
            onClick={() => {
              if (isUnstakingDiasabled) return
              this.bloc.unstake(stakingToken, _stakingPoolPID, selectedAddress$.value)
            }}
            className={cx("SUWController__confirmButton", {
              "SUWController__confirmButton--disabled": isUnstakingDiasabled,
            })}
          >
            {I18n.t('myasset.unstaking')}
          </button>
        </>
      )
    }

    if (mode === 'withdraw') {

      const isWithdrawDisabled = !this.bloc.withdrawAmount$.value
        || new BigNumber(this.bloc.withdrawAmount$.value).lte(0)
        || new BigNumber(this.bloc.withdrawAmount$.value).gt(availableStakingBalance)
        || !isValidDecimal(this.bloc.withdrawAmount$.value, stakingToken.decimals)

      return (
        <>
          <button
            onClick={() => {
              if (isWithdrawDisabled) return
              this.bloc.withdraw(stakingToken)
            }}
            className={cx("SUWController__confirmButton", {
              "SUWController__confirmButton--disabled": isWithdrawDisabled,
            })}
          >
            {I18n.t('myasset.withdraw')}
          </button>
        </>
      )
    }
  }

  renderStaking = () => {
    const { stakingToken } = this.props

    const availableBalance = balancesInWallet$.value[stakingToken.address] &&
      balancesInWallet$.value[stakingToken.address].balanceParsed

    const isApproved = (allowancesInStakingPool$.value && allowancesInStakingPool$.value[stakingToken.address] != 0)

    if (!isApproved) {
      return (
        <>
          <p className="SUWController__title">{I18n.t('myasset.suwController.stakingApprove.title')}</p>
          <p className="SUWController__description">{I18n.t('needApprove')}</p>
          {this.renderButton()}
        </>
      )
    }

    return (
      <>
        <p className="SUWController__title">{I18n.t('myasset.suwController.staking.title')}</p>
        <div className="SUWController__available">
          <span 
            className="SUWController__availableLabel"
          >
            {I18n.t('myasset.suwController.stakingAvailable', {
              title: stakingToken.title
            })} 
          </span>
          <span 
            className="SUWController__availableAmount"
          >
            {Number(availableBalance).toLocaleString('en-us', { maximumFractionDigits: 4 })}
          </span>
        </div>

        <InputWithPercentage
          autoFocus
          className="SUWController__depositInput SUWController__depositInput--common"
          decimalLimit={stakingToken.decimals}
          value$={this.bloc.stakeAmount$}
          valueLimit={availableBalance}
          targetToken={stakingToken}
        />
        {this.renderButton()}
      </>
    )
  }

  renderUnstaking = () => {
    const { stakingToken } = this.props

    const availableBalance = balancesInStakingPool$.value[stakingToken.address] &&
      balancesInStakingPool$.value[stakingToken.address].balanceParsed

    return (
      <>
        <p className="SUWController__title">{I18n.t('myasset.suwController.unstaking.title')}</p>
        <div className="SUWController__available">
          <span
            className="SUWController__availableLabel"
          >
            {I18n.t('myasset.suwController.unstakingAvailable', {
              title: stakingToken.title
            })}
          </span>
          <span
            className="SUWController__availableAmount"
          >
            {Number(availableBalance).toLocaleString('en-us', { maximumFractionDigits: 4 })}
          </span>
        </div>

        <InputWithPercentage
          autoFocus
          className="SUWController__depositInput SUWController__depositInput--common"
          decimalLimit={stakingToken.decimals}
          value$={this.bloc.unstakeAmount$}
          valueLimit={availableBalance}
          targetToken={stakingToken}
        />
        {this.renderButton()}
      </>
    )
  }

  renderWithdraw = () => {
    const { stakingToken } = this.props

    const availableBalance = balancesInWallet$.value[stakingToken.address] &&
      balancesInWallet$.value[stakingToken.address].balanceParsed

    return (
      <>
        <p className="SUWController__title">{I18n.t('myasset.suwController.withdraw.title')}</p>
        <div className="SUWController__available">
          <span
            className="SUWController__availableLabel"
          >
            {I18n.t('myasset.suwController.withdrawAvailable', {
              title: stakingToken.title
            })}
          </span>
          <span
            className="SUWController__availableAmount"
          >
            {Number(availableBalance).toLocaleString('en-us', { maximumFractionDigits: 4 })}
          </span>
        </div>

        <InputWithPercentage
          autoFocus
          className="SUWController__depositInput SUWController__depositInput--common"
          decimalLimit={stakingToken.decimals}
          value$={this.bloc.withdrawAmount$}
          valueLimit={availableBalance}
          targetToken={stakingToken}
        />
        {this.renderButton()}
      </>
    )
  }

  renderWKLAYSwitch = () => {
    const WKLAY = tokenList.WKLAY

    const availableBalance = balancesInWallet$.value[WKLAY.address] &&
      balancesInWallet$.value[WKLAY.address].balanceParsed

    return (
      <>
        <p className="SUWController__title">{I18n.t('myasset.suwController.wklaySwitch.title')}</p>
        <p className="SUWController__description">{I18n.t('myasset.suwController.wklaySwitch.description')}</p>
        <div className="SUWController__available">
          <span
            className="SUWController__availableLabel"
          >
            {I18n.t('convertable', {
              title: WKLAY.title
            })}
          </span>
          <span
            className="SUWController__availableAmount"
          >
            {Number(availableBalance).toLocaleString('en-us', { maximumFractionDigits: 4 })}
          </span>
        </div>

        <InputWithPercentage
          autoFocus
          className="SUWController__depositInput SUWController__depositInput--common"
          decimalLimit={WKLAY.decimals}
          value$={this.bloc.wklayAmountToUnwrap$}
          valueLimit={availableBalance}
          targetToken={WKLAY}
        />

        <div className="SUWController__willReceive">
          <span className="SUWController__willReceiveLabel">{I18n.t('willConvert', { title: "KLAY" })}</span>
          <span className="SUWController__willReceiveAmount">{Number(this.bloc.withdrawAmount$.value).toLocaleString('en-us', { maximumFractionDigits: 4 })}</span>
        </div>
        {this.renderButton()}
        <button
          onClick={() => {
            closeModal$.next(true)
          }}
          className={cx("SUWController__doLaterButton")}
        >
          {I18n.t('doLater')}
        </button>
      </>
    )
  }

  renderContent = () => {
    const {
      mode,
    } = this.props

    console.log(this.bloc.wklayWithdrawCompleted$.value, 'this.bloc.wklayWithdrawCompleted$.value')

    if (this.bloc.wklayWithdrawCompleted$.value) {
      return this.renderWKLAYSwitch()
    }

    if (mode === 'staking') {
      return this.renderStaking()
    }

    if (mode === 'unstaking') {
      return this.renderUnstaking()
    }

    if (mode === 'withdraw') {
      return this.renderWithdraw()
    }
  }

  render() {
    return (
      <Modal className="SUWController__modal">
        {this.renderContent()}
      </Modal>
    )
  }
}

export default SUWController