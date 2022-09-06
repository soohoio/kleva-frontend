import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import BigNumber from 'bignumber.js'
import { BehaviorSubject, Subject, merge } from 'rxjs'
import { debounceTime, distinctUntilChanged, takeUntil, tap } from 'rxjs/operators'

import { balancesInWallet$, allowancesInLendingPool$ } from 'streams/wallet'


import InputWithPercentage from '../common/InputWithPercentage'

import Modal from '../common/Modal'
import Bloc from './LendAndStakeControllerPopup.bloc'

import './LendAndStakeControllerPopup.scss'
import { isValidDecimal } from '../../utils/calc'
import { tokenList } from '../../constants/tokens'
import { isSameAddress, noRounding } from '../../utils/misc'
import { I18n } from '../common/I18n'
import QuestionMark from '../common/QuestionMark'
import { stakingPoolsByToken } from '../../constants/stakingpool'
import { allowancesInStakingPool$, selectedAddress$ } from '../../streams/wallet'
import { closeModal$ } from 'streams/ui';
import LabelAndValue from '../LabelAndValue'
import Tip from '../common/Tip'
import { openModal$ } from '../../streams/ui'
import CompletedModal from '../common/CompletedModal'
import { currentTab$ } from '../../streams/view'

class LendAndStakeControllerPopup extends Component {
  destroy$ = new Subject()
  isTipOpened$ = new BehaviorSubject(false)

  bloc = new Bloc()

  componentDidMount() {
    const { stakingToken } = this.props

    merge(
      this.isTipOpened$,
      this.bloc.depositAmount$,
      this.bloc.stakeAmount$,
      this.bloc.klayAmountToWrap$,
      this.bloc.isWrapping$,
      this.bloc.isLoading$,
      this.bloc.lendCompleted$,
      selectedAddress$,
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

    let { vaultAddress, stakingToken, ibToken } = this.props
    const isLendCompleted = !!this.bloc.lendCompleted$.value

    const isKLAY = isSameAddress(stakingToken.address, tokenList.KLAY.address)

    if (isKLAY) {
      stakingToken = tokenList.WKLAY
    }

    if (this.bloc.isLoading$.value) {
      return (
        <button
          className="LendAndStakeControllerPopup__confirmButton"
        >
          ...
        </button>
      )
    }

    if (!isLendCompleted) {
      const isLendApproved = (allowancesInLendingPool$.value && allowancesInLendingPool$.value[vaultAddress] != 0)

      const availableBalance = balancesInWallet$.value[stakingToken.address] &&
        balancesInWallet$.value[stakingToken.address].balanceParsed

      const isDisabled = !this.bloc.depositAmount$.value
        || new BigNumber(this.bloc.depositAmount$.value).lte(0)
        || new BigNumber(this.bloc.depositAmount$.value).gt(availableBalance)
        || !isValidDecimal(this.bloc.depositAmount$.value, stakingToken.decimals)

      // When lend not approved
      if (!isLendApproved) {
        return (
          <button
            onClick={() => this.bloc.approve(stakingToken, vaultAddress)}
            className="LendAndStakeControllerPopup__confirmButton"
          >
            {I18n.t('approve')}
          </button>
        )
      }

      return (
        <button
          onClick={() => {
            // if (isDisabled) return
            this.bloc.deposit(stakingToken, vaultAddress)
          }}
          className={cx("LendAndStakeControllerPopup__confirmButton", {
            "LendAndStakeControllerPopup__confirmButton--disabled": isDisabled,
          })}
        >
          {I18n.t('lend')}
        </button>
      )
    }

    
    // Staking
    const isStakingApproved = (allowancesInStakingPool$.value && allowancesInStakingPool$.value[ibToken.address] != 0)

    const availableStakingBalance = balancesInWallet$.value[ibToken.address] &&
      balancesInWallet$.value[ibToken.address].balanceParsed

    const isStakingDisabled = !this.bloc.stakeAmount$.value
      || new BigNumber(this.bloc.stakeAmount$.value).lte(0)
      || new BigNumber(this.bloc.stakeAmount$.value).gt(availableStakingBalance)
      || !isValidDecimal(this.bloc.stakeAmount$.value, ibToken.decimals)

    const _stakingPool = stakingPoolsByToken[ibToken.address]
    const _stakingPoolPID = _stakingPool && _stakingPool.pid

    if (!isStakingApproved) {
      return (
        <button
          onClick={() => this.bloc.approveStaking(ibToken)}
          className="LendAndStakeControllerPopup__confirmButton"
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
          className={cx("LendAndStakeControllerPopup__confirmButton", {
            "LendAndStakeControllerPopup__confirmButton--disabled": isStakingDisabled,
          })}
        >
          {I18n.t('stake')}
        </button>
        <button
          onClick={() => {
            openModal$.next({
              component: (
                <CompletedModal menus={[
                  {
                    title: I18n.t('viewInMyAsset'),
                    onClick: () => {
                      closeModal$.next(true)
                      currentTab$.next('myasset')
                    }
                  },
                  {
                    title: I18n.t('checkLater'),
                    onClick: () => {
                      closeModal$.next(true)
                    }
                  },
                ]}>
                  <p className="CompletedModal__title">{I18n.t('lendstake.controller.lendCompleted.title')}</p>
                  <p className="CompletedModal__description">{I18n.t('lendstake.controller.lendCompleted.description')}</p>
                </CompletedModal>
              )
            })
          }}
          className={cx("LendAndStakeControllerPopup__doLaterButton")}
        >
          {I18n.t('doLater')}
        </button>
      </>
    )
  }

  renderContent = () => {
    const { 
      vaultAddress, 
      stakingToken, 
      ibToken, 
      ibTokenPrice,
      lendingAPR,
      stakingAPR,
      protocolAPR,
    } = this.props

    const availableBalance = balancesInWallet$.value[stakingToken.address] &&
      balancesInWallet$.value[stakingToken.address].balanceParsed


    const willReceiveAmount = (ibTokenPrice && this.bloc.depositAmount$.value)
      ? noRounding(new BigNumber(this.bloc.depositAmount$.value).div(ibTokenPrice).toNumber(), 4)
      : "0.00"

    const isApproved = (allowancesInLendingPool$.value && allowancesInLendingPool$.value[vaultAddress] != 0)

    const isLendCompleted = !!this.bloc.lendCompleted$.value

    if (!isApproved) {
      return (
        <>
          <p className="LendAndStakeControllerPopup__title">{I18n.t('lendnstake.controller.tokenToIbToken')}</p>

          <div className="LendAndStakeControllerPopup__ibTokenPrice Tip__parent">
            1 ib{stakingToken.title} = {noRounding(ibTokenPrice, 4)} {stakingToken.title}
            <QuestionMark
              onClick={() => this.isTipOpened$.next(!this.isTipOpened$.value)}
            />
            <Tip
              isOpened$={this.isTipOpened$}
              title={I18n.t('tip.ibToken.title')}
              content={I18n.t('tip.ibToken.description')}
            />
          </div>
          <p className="LendAndStakeControllerPopup__description">{I18n.t('needApprove')}</p>
          {this.renderButton()}
        </>
      )
    }

    if (!isLendCompleted) {
      return (
        <>
          <p className="LendAndStakeControllerPopup__title">{I18n.t('lendnstake.controller.tokenToIbToken')}</p>

          <div className="LendAndStakeControllerPopup__ibTokenPrice Tip__parent">
            1 ib{stakingToken.title} = {noRounding(ibTokenPrice, 4)} {stakingToken.title}
            <QuestionMark
              onClick={() => this.isTipOpened$.next(!this.isTipOpened$.value)}
            />
            <Tip
              isOpened$={this.isTipOpened$}
              title={I18n.t('tip.ibToken.title')}
              content={I18n.t('tip.ibToken.description')}
            />
          </div>
          <div className="LendAndStakeControllerPopup__available">
            <span className="LendAndStakeControllerPopup__availableLabel">{I18n.t('lendstake.controller.available')} {stakingToken.title}</span>
            <span className="LendAndStakeControllerPopup__availableAmount">{Number(availableBalance).toLocaleString('en-us', { maximumFractionDigits: 4 })}</span>
          </div>

          <InputWithPercentage
            autoFocus
            className="LendAndStakeControllerPopup__depositInput LendAndStakeControllerPopup__depositInput--common"
            decimalLimit={stakingToken.decimals}
            value$={this.bloc.depositAmount$}
            valueLimit={availableBalance}
            targetToken={stakingToken}
          />

          <div className="LendAndStakeControllerPopup__willReceive">
            <span className="LendAndStakeControllerPopup__willReceiveLabel">{I18n.t('lendstake.controller.willReceive')} ib{stakingToken.title}</span>
            <span className="LendAndStakeControllerPopup__willReceiveAmount">~{willReceiveAmount}</span>
          </div>

          {this.renderButton()}
        </>
      )
    }

    // staking
    const availableStakingBalance = balancesInWallet$.value[ibToken.address] &&
      balancesInWallet$.value[ibToken.address].balanceParsed

    return (
      <>
        <p className="LendAndStakeControllerPopup__title">{I18n.t('lendnstake.controller.tokenToIbTokenCompleted')}</p>

        <p className="LendAndStakeControllerPopup__description">
          {I18n.t('lendnstake.controller.stakeIbToken')}
        </p>

        <div className="LendAndStakeControllerPopup__aprDetail">
          <LabelAndValue label={I18n.t('lendingAPRFull')} value={`${noRounding(lendingAPR, 2)}%`} />
          <LabelAndValue className="LendAndStakeControllerPopup__stakingAPR" label={I18n.t('stakingAPRFull')} value={`${noRounding(stakingAPR, 2)}%`} />
          {!!protocolAPR && <LabelAndValue label={I18n.t('protocolAPRFull')} value={`${noRounding(protocolAPR, 2)}%`} />}
        </div>
        

        <div className="LendAndStakeControllerPopup__available">
          <span className="LendAndStakeControllerPopup__availableLabel">{I18n.t('lendstake.controller.stakingAvailable')} ib{stakingToken.title}</span>
          <span className="LendAndStakeControllerPopup__availableAmount">{Number(availableStakingBalance).toLocaleString('en-us', { maximumFractionDigits: 4 })}</span>
        </div>

        <InputWithPercentage
          autoFocus
          className="LendAndStakeControllerPopup__depositInput LendAndStakeControllerPopup__depositInput--common"
          decimalLimit={ibToken.decimals}
          value$={this.bloc.stakeAmount$}
          valueLimit={availableStakingBalance}
          targetToken={ibToken}
        />

        {this.renderButton()}
      </>
    )
  }

  renderWKLAYSwitch = () => {
    const { stakingToken } = this.props
    const availableBalance = balancesInWallet$.value[stakingToken.address] &&
      balancesInWallet$.value[stakingToken.address].balanceParsed

    const isWrapDisabled = !this.bloc.klayAmountToWrap$.value
      || new BigNumber(this.bloc.klayAmountToWrap$.value).lte(0)
      || new BigNumber(this.bloc.klayAmountToWrap$.value).gt(availableBalance)
      || !isValidDecimal(this.bloc.klayAmountToWrap$.value, stakingToken.decimals)

    return (
      <>

        <p className="LendAndStakeControllerPopup__title">{I18n.t('lendstake.controller.wklaySwitch.title')}</p>

        <div className="LendAndStakeControllerPopup__available">
          <span className="LendAndStakeControllerPopup__availableLabel">{I18n.t('lendstake.controller.available')} {stakingToken.title}</span>
          <span className="LendAndStakeControllerPopup__availableAmount">{Number(availableBalance).toLocaleString('en-us', { maximumFractionDigits: 4 })}</span>
        </div>

        <div className="LendAndStakeControllerPopup__inputAndButton">
          <InputWithPercentage
            autoFocus
            className="LendAndStakeControllerPopup__depositInput LendAndStakeControllerPopup__depositInput--common"
            decimalLimit={stakingToken.decimals}
            value$={this.bloc.klayAmountToWrap$}
            valueLimit={availableBalance}
            targetToken={stakingToken}
          />
          {this.bloc.isWrapping$.value
            ? (
              <button
                className="LendAndStakeControllerPopup__wrapButton"
              >
                ...
              </button>
            )
            : (
              <button
                onClick={() => {
                  if (isWrapDisabled) return
                  this.bloc.wrapKLAY()
                }}
                className={cx("LendAndStakeControllerPopup__wrapButton", {
                  "LendAndStakeControllerPopup__wrapButton--disabled": isWrapDisabled,
                })}
              >
                {I18n.t('switch')}
              </button>
            )
          }
        </div>
        <hr className="LendAndStakeControllerPopup__hr" />
      </>
    )
  }

  renderWKLAYLend = () => {
    const {
      vaultAddress,
      stakingToken,
      ibToken,
      ibTokenPrice,
      lendingAPR,
      stakingAPR,
      protocolAPR,
    } = this.props

    const isApproved = (allowancesInLendingPool$.value && allowancesInLendingPool$.value[vaultAddress] != 0)

    const availableWKLAYBalance = balancesInWallet$.value[tokenList.WKLAY.address] &&
      balancesInWallet$.value[tokenList.WKLAY.address].balanceParsed

    const willReceiveAmount = (ibTokenPrice && this.bloc.depositAmount$.value)
      ? noRounding(new BigNumber(this.bloc.depositAmount$.value).div(ibTokenPrice).toNumber(), 4)
      : "0.00"

    const isLendCompleted = !!this.bloc.lendCompleted$.value

    if (!isApproved) {
      return (
        <>
          <p className="LendAndStakeControllerPopup__title">{I18n.t('lendnstake.controller.tokenToIbToken')}</p>

          <div className="LendAndStakeControllerPopup__ibTokenPrice Tip__parent">
            1 ibKLAY = {noRounding(ibTokenPrice, 4)} KLAY
            <QuestionMark
              onClick={() => this.isTipOpened$.next(!this.isTipOpened$.value)}
            />
            <Tip
              isOpened$={this.isTipOpened$}
              title={I18n.t('tip.ibToken.title')}
              content={I18n.t('tip.ibToken.description')}
            />
          </div>
          <p className="LendAndStakeControllerPopup__description">{I18n.t('needApprove')}</p>
          {this.renderButton()}
        </>
      )
    }

    if (!isLendCompleted) {
      return (
        <>
          <p className="LendAndStakeControllerPopup__title">{I18n.t('lendstake.controller.wklaySwitch.title2')}</p>

          <div className="LendAndStakeControllerPopup__ibTokenPrice Tip__parent">
            1 ibKLAY = {noRounding(ibTokenPrice, 4)} KLAY
          <QuestionMark
              onClick={() => this.isTipOpened$.next(!this.isTipOpened$.value)}
            />
            <Tip
              isOpened$={this.isTipOpened$}
              title={I18n.t('tip.ibToken.title')}
              content={I18n.t('tip.ibToken.description')}
            />
          </div>

          <div className="LendAndStakeControllerPopup__available">
            <span className="LendAndStakeControllerPopup__availableLabel">{I18n.t('lendstake.controller.available')} WKLAY</span>
            <span className="LendAndStakeControllerPopup__availableAmount">{Number(availableWKLAYBalance).toLocaleString('en-us', { maximumFractionDigits: 4 })}</span>
          </div>

          <InputWithPercentage
            className={cx("LendAndStakeControllerPopup__depositInput", {
              "LendAndStakeControllerPopup__depositInput--upper": true
            })}
            decimalLimit={stakingToken.decimals}
            value$={this.bloc.depositAmount$}
            valueLimit={availableWKLAYBalance}
            targetToken={tokenList.WKLAY}
          />

          <div className="LendAndStakeControllerPopup__willReceive">
            <span className="LendAndStakeControllerPopup__willReceiveLabel">{I18n.t('lendstake.controller.willReceive')} ib{stakingToken.title}</span>
            <span className="LendAndStakeControllerPopup__willReceiveAmount">~{willReceiveAmount}</span>
          </div>

          {this.renderButton()}
        </>
      )
    }

    // Staking
    const availableStakingBalance = balancesInWallet$.value[ibToken.address] &&
      balancesInWallet$.value[ibToken.address].balanceParsed

    return (
      <>
        <p className="LendAndStakeControllerPopup__title">{I18n.t('lendnstake.controller.tokenToIbTokenCompleted')}</p>

        <p className="LendAndStakeControllerPopup__description">
          {I18n.t('lendnstake.controller.stakeIbToken')}
        </p>

        <div className="LendAndStakeControllerPopup__aprDetail">
          <LabelAndValue label={I18n.t('lendingAPRFull')} value={`${noRounding(lendingAPR, 2)}%`} />
          <LabelAndValue className="LendAndStakeControllerPopup__stakingAPR" label={I18n.t('stakingAPRFull')} value={`${noRounding(stakingAPR, 2)}%`} />
          {!!protocolAPR && <LabelAndValue label={I18n.t('protocolAPRFull')} value={`${noRounding(protocolAPR, 2)}%`} />}
        </div>


        <div className="LendAndStakeControllerPopup__available">
          <span className="LendAndStakeControllerPopup__availableLabel">{I18n.t('lendstake.controller.stakingAvailable')} ib{stakingToken.title}</span>
          <span className="LendAndStakeControllerPopup__availableAmount">{Number(availableStakingBalance).toLocaleString('en-us', { maximumFractionDigits: 4 })}</span>
        </div>

        <InputWithPercentage
          autoFocus
          className="LendAndStakeControllerPopup__depositInput LendAndStakeControllerPopup__depositInput--common"
          decimalLimit={ibToken.decimals}
          value$={this.bloc.stakeAmount$}
          valueLimit={availableStakingBalance}
          targetToken={ibToken}
        />

        {this.renderButton()}
      </>
    )
  }

  renderWKLAYContent = () => {
    const isLendCompleted = !!this.bloc.lendCompleted$.value

    return (
      <>
        {!isLendCompleted && this.renderWKLAYSwitch()}
        {this.renderWKLAYLend()}
      </>
    )
  }

  render() {
    const { stakingToken } = this.props

    const isKLAY = isSameAddress(stakingToken.address, tokenList.KLAY.address)

    return (
      <Modal className="LendAndStakeControllerPopup__modal">
        {isKLAY
          ? this.renderWKLAYContent()
          : this.renderContent()
        }
      </Modal>
    )
  }
}

export default LendAndStakeControllerPopup