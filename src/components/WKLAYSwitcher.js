import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import Bloc from './WKLAYSwitcher.bloc'

import './WKLAYSwitcher.scss'
import { tokenList } from '../constants/tokens'
import InputWithPercentage from './common/InputWithPercentage'

class WKLAYSwitcher extends Component {
  bloc = new Bloc()

  destroy$ = new Subject()

  state = {
    // tokenList.WKLAY
    selectedToken: tokenList.KLAY,
  }

  componentDidMount() {
    merge(
      this.bloc.klayAmountToWrap$,
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }

  selectToken = (token) => {
    this.setState({
      selectedToken: token,
    })
  }

  renderInput = () => {
    const { selectedToken } = this.state
    const { 
      value$,
      valueLimit,
      labelValue,
      imgSrc,
      labelTitle,
      inputLabel,
      balancesInWallet,
    } = this.props

    if (selectedToken.address === tokenList.KLAY.address) {
      return (
        <InputWithPercentage
          decimalLimit={selectedToken.decimals}
          imgSrc={imgSrc}
          value$={this.bloc.klayAmountToWrap$}
          label=""
          valueLimit={valueLimit}
          targetToken={selectedToken}
        />
      )
    }

    const WKLAYBalance = balancesInWallet[tokenList.WKLAY.address] && balancesInWallet[tokenList.WKLAY.address].balanceParsed

    return (
      <InputWithPercentage
        decimalLimit={selectedToken.decimals}
        imgSrc={imgSrc}
        value$={value$}
        label=""
        valueLimit={WKLAYBalance}
        targetToken={selectedToken}
      />
    )
  }

  renderButton = () => {
    const { selectedToken } = this.state
    
    if (selectedToken.address === tokenList.KLAY.address) {
      return (
        <button className="WKLAYSwitcher__wrapButton" onClick={this.bloc.wrapKLAY}>Wrap KLAY</button>
      )
    }

    return null
  }
    
  render() {
    const { selectedToken } = this.state
    const { balancesInWallet } = this.props

    return (
      <div className="WKLAYSwitcher">
        <div className="WKLAYSwitcher__tabs">
          <div 
            className={cx("WKLAYSwitcher__KLAYTab", {
              "WKLAYSwitcher__KLAYTab--active": selectedToken.address === tokenList.KLAY.address,
            })}
            onClick={() => this.selectToken(tokenList.KLAY)} 
          >
            <p className="WKLAYSwitcher__tabTitle">Available KLAY</p>
            <p className="WKLAYSwitcher__tabValue">{balancesInWallet[tokenList.KLAY.address] && balancesInWallet[tokenList.KLAY.address].balanceParsed}</p>
          </div>
          <div 
            onClick={() => this.selectToken(tokenList.WKLAY)} 
            className={cx("WKLAYSwitcher__WKLAYTab", {
              "WKLAYSwitcher__WKLAYTab--active": selectedToken.address === tokenList.WKLAY.address,
            })}
          >
            <p className="WKLAYSwitcher__tabTitle">Available WKLAY</p>
            <p className="WKLAYSwitcher__tabValue">{balancesInWallet[tokenList.WKLAY.address] && balancesInWallet[tokenList.WKLAY.address].balanceParsed}</p>
          </div>
        </div>
        <div className="WKLAYSwitcher__content">
          {this.renderInput()}
          {this.renderButton()}
        </div>

      </div>
    )
  }
}

export default WKLAYSwitcher