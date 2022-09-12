import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { debounceTime, distinctUntilChanged, takeUntil, tap } from 'rxjs/operators'

import Bloc from './WKLAYSwitcher.bloc'

import './WKLAYSwitcher.scss'
import { tokenList } from '../../constants/tokens'
import InputWithPercentage from './InputWithPercentage'
import { nFormatter, noRounding } from '../../utils/misc'
import SupplyInput from './SupplyInput'
import { I18n } from './I18n'

class WKLAYSwitcher extends Component {
  bloc = new Bloc(this)

  destroy$ = new Subject()

  componentDidMount() {
    merge(
      this.bloc.isWrapping$.pipe(
        distinctUntilChanged(),
        tap(() => {
          this.bloc.klayAmountToWrap$.next('')
          this.bloc.wklayAmountToUnwrap$.next('')
        })
      ),
      this.bloc.klayAmountToWrap$,
      this.bloc.wklayAmountToUnwrap$,
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

  renderWKLAYToKLAY = () => {
    const { balancesInWallet, column } = this.props

    const availableBalance = balancesInWallet[tokenList.WKLAY.address] && balancesInWallet[tokenList.WKLAY.address].balanceParsed

    const isUnwrapDisabled = !this.bloc.wklayAmountToUnwrap$.value
      || new BigNumber(this.bloc.wklayAmountToUnwrap$.value).lte(0)
      || new BigNumber(this.bloc.wklayAmountToUnwrap$.value).gt(availableBalance)
      || !isValidDecimal(this.bloc.wklayAmountToUnwrap$.value, 18)

    return (
      <div 
        className={cx("WKLAYSwitcher", {
          "WKLAYSwitcher--column": column
        })}
      >
        <div className="WKLAYSwitcher__available">
          <span className="WKLAYSwitcher__availableLabel">{I18n.t('lendstake.controller.available')} WKLAY</span>
          <span className="WKLAYSwitcher__availableAmount">{Number(availableBalance).toLocaleString('en-us', { maximumFractionDigits: 4 })}</span>
        </div>
        <div className="WKLAYSwitcher__inputAndButton">
          <InputWithPercentage
            noPercentage={!column}
            className="WKLAYSwitcher__depositInput WKLAYSwitcher__depositInput--common"
            decimalLimit={18}
            value$={this.bloc.wklayAmountToUnwrap$}
            valueLimit={availableBalance}
            targetToken={tokenList.WKLAY}
          />
          {column && (
            <div className="WKLAYSwitcher__willReceive">
              <span className="WKLAYSwitcher__willReceiveLabel">{I18n.t('willConvert', { title: "KLAY" })}</span>
              <span className="WKLAYSwitcher__willReceiveAmount">
                {this.bloc.wklayAmountToUnwrap$.value
                  ? noRounding(this.bloc.wklayAmountToUnwrap$.value, 18)
                  : "0"
                }
              </span>
            </div>
          )}
          {this.bloc.isWrapping$.value
            ? (
              <button
                className="WKLAYSwitcher__wrapButton"
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
                className={cx("WKLAYSwitcher__wrapButton", {
                  "WKLAYSwitcher__wrapButton--disabled": isUnwrapDisabled,
                })}
              >
                {I18n.t('switch')}
              </button>
            )
          }
        </div>
      </div>
    )
  }

  render() {
    const { description, balancesInWallet, toKLAY, column } = this.props

    if (!!toKLAY) {
      // WKLAY to KLAY
      return this.renderWKLAYToKLAY()
    }

    const availableBalance = balancesInWallet[tokenList.KLAY.address] && balancesInWallet[tokenList.KLAY.address].balanceParsed

    const isWrapDisabled = !this.bloc.klayAmountToWrap$.value
      || new BigNumber(this.bloc.klayAmountToWrap$.value).lte(0)
      || new BigNumber(this.bloc.klayAmountToWrap$.value).gt(availableBalance)
      || !isValidDecimal(this.bloc.klayAmountToWrap$.value, 18)

    // KLAY to WKLAY
    return (
      <div 
        className={cx("WKLAYSwitcher", {
          "WKLAYSwitcher--column": column,
        })}
      >
        {!!description && description}
        <div className="WKLAYSwitcher__available">
          <span className="WKLAYSwitcher__availableLabel">{I18n.t('lendstake.controller.available')} KLAY</span>
          <span className="WKLAYSwitcher__availableAmount">{Number(availableBalance).toLocaleString('en-us', { maximumFractionDigits: 4 })}</span>
        </div>
        <div className="WKLAYSwitcher__inputAndButton">
          <InputWithPercentage
            className="WKLAYSwitcher__depositInput WKLAYSwitcher__depositInput--common"
            decimalLimit={18}
            value$={this.bloc.klayAmountToWrap$}
            valueLimit={availableBalance}
            targetToken={tokenList.KLAY}
          />
          {column && (
            <div className="WKLAYSwitcher__willReceive">
              <span className="WKLAYSwitcher__willReceiveLabel">{I18n.t('willConvert', { title: "WKLAY" })}</span>
              <span className="WKLAYSwitcher__willReceiveAmount">
                {this.bloc.klayAmountToWrap$.value
                  ? noRounding(this.bloc.klayAmountToWrap$.value, 18)
                  : "0"
                }
              </span>
            </div>
          )}
          {this.bloc.isWrapping$.value
            ? (
              <button
                className="WKLAYSwitcher__wrapButton"
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
                className={cx("WKLAYSwitcher__wrapButton", {
                  "WKLAYSwitcher__wrapButton--disabled": isWrapDisabled,
                })}
              >
                {I18n.t('switch')}
              </button>
            )
          }
        </div>
      </div>
    )
  }
}

export default WKLAYSwitcher