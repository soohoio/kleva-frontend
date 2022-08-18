import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { debounceTime, takeUntil, tap } from 'rxjs/operators'

import Bloc from './WKLAYSwitcher.bloc'

import './WKLAYSwitcher.scss'
import { tokenList } from '../../constants/tokens'
import InputWithPercentage from './InputWithPercentage'
import { nFormatter } from '../../utils/misc'
import SupplyInput from './SupplyInput'
import { I18n } from './I18n'

class WKLAYSwitcher extends Component {
  bloc = new Bloc()

  destroy$ = new Subject()

  componentDidMount() {
    merge(
      this.bloc.isWrapping$,
      this.bloc.klayAmountToWrap$,
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

  render() {
    const { balancesInWallet } = this.props

    const availableBalance = balancesInWallet[tokenList.KLAY.address] && balancesInWallet[tokenList.KLAY.address].balanceParsed

    const isWrapDisabled = !this.bloc.klayAmountToWrap$.value
      || new BigNumber(this.bloc.klayAmountToWrap$.value).lte(0)
      || new BigNumber(this.bloc.klayAmountToWrap$.value).gt(availableBalance)
      || !isValidDecimal(this.bloc.klayAmountToWrap$.value, 18)

    return (
      <div className="WKLAYSwitcher">
        <div className="WKLAYSwitcher__available">
          <span className="WKLAYSwitcher__availableLabel">{I18n.t('lendstake.controller.available')} KLAY</span>
          <span className="WKLAYSwitcher__availableAmount">{Number(availableBalance).toLocaleString('en-us', { maximumFractionDigits: 4 })}</span>
        </div>
        <div className="WKLAYSwitcher__inputAndButton">
          <InputWithPercentage
            noPercentage
            className="WKLAYSwitcher__depositInput WKLAYSwitcher__depositInput--common"
            decimalLimit={18}
            value$={this.bloc.klayAmountToWrap$}
            valueLimit={availableBalance}
            targetToken={tokenList.KLAY}
          />
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