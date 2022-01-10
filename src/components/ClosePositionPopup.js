import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, interval } from 'rxjs'
import { switchMap, distinctUntilChanged, startWith, takeUntil, tap, map } from 'rxjs/operators'

import Modal from 'components/common/Modal'

import './ClosePositionPopup.scss'
import ConvertToBaseTokenSummary from './ConvertToBaseTokenSummary'

import Bloc from './ClosePositionPopup.bloc'
import MinimizeTradingSummary from './MinimizeTradingSummary'

import RadioSet from 'components/common/RadioSet'
import { klayswapPoolInfo$, positions$ } from '../streams/farming'
import { health$ } from '../streams/contract'
import { getEachTokenBasedOnLPShare } from '../utils/calc'

class ClosePositionPopup extends Component {
  destroy$ = new Subject()
  
  constructor(props) {
    super(props)
    this.bloc = new Bloc(props)
  }
  
  componentDidMount() {
    merge(
      this.bloc.positionValue$,
      this.bloc.equityValue$,
      this.bloc.debtValue$,
      this.bloc.health$,
      this.bloc.closingMethod$,
      this.bloc.userFarmingTokenAmount$,
      this.bloc.userBaseTokenAmount$,

      this.bloc.lpToken$,

      klayswapPoolInfo$,
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })

    // Interval Health Check
    // interval(1000 * 5).pipe(
    //   startWith(0),
    //   // switchMap(() => health$( ))
    //   takeUntil(this.destroy$),
    // ).subscribe(() => {

    // })

    merge(positions$).pipe(
      map((positions) => {
        const positionInfo = positions && positions.find(({ id }) => id == this.props.id)
        return positionInfo
      }),
      tap((positionInfo) => {
        const { farmingToken, baseToken } = this.props

        const positionValue = positionInfo && positionInfo.positionValue
        const debtValue = positionInfo && positionInfo.debtValue
        const equityValue = positionInfo && new BigNumber(positionInfo.positionValue).minus(debtValue)

        const lpShare = positionInfo && positionInfo.lpShare
        const lpToken = positionInfo && positionInfo.lpToken

        const poolInfo = klayswapPoolInfo$.value[lpToken && lpToken.address && lpToken.address.toLowerCase()]

        const { userFarmingTokenAmount, userBaseTokenAmount } = getEachTokenBasedOnLPShare({ poolInfo, lpShare, farmingToken, baseToken })

        const positionValueParsed = new BigNumber(positionValue)
          .div(10 ** this.props.baseToken.decimals)
          .toNumber()
          .toLocaleString('en-us', { maximumFractionDigits: 6 })

        const equityValueParsed = new BigNumber(positionValue)
          .minus(debtValue)
          .div(10 ** this.props.baseToken.decimals)
          .toNumber()
          .toLocaleString('en-us', { maximumFractionDigits: 6 })

        const debtValueParsed = new BigNumber(debtValue)
          .div(10 ** this.props.baseToken.decimals)
          .toNumber()
          .toLocaleString('en-us', { maximumFractionDigits: 6 })

        this.bloc.lpToken$.next(lpToken)
        this.bloc.lpShare$.next(lpShare)

        this.bloc.positionValue$.next(positionValueParsed)
        this.bloc.equityValue$.next(equityValueParsed)
        this.bloc.debtValue$.next(debtValueParsed)
        this.bloc.userFarmingTokenAmount$.next(userFarmingTokenAmount)
        this.bloc.userBaseTokenAmount$.next(userBaseTokenAmount)
      })
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })
  }
  
  componentWillUnMount() {
    this.destroy$.next(true)
  }

  renderSummary = () => {
    const { title, farmingToken, baseToken, tokenPrices } = this.props
    const lpToken = this.bloc.lpToken$.value
    const poolInfo = klayswapPoolInfo$.value[lpToken && lpToken.address.toLowerCase()]

    switch (this.bloc.closingMethod$.value) {
      case 'minimizeTrading':
        return (
          <MinimizeTradingSummary
            poolInfo={poolInfo}
            tokenPrices={tokenPrices}
            farmingToken={farmingToken}
            baseToken={baseToken}
            positionValue={this.bloc.positionValue$.value}
            equityValue={this.bloc.equityValue$.value}
            debtValue={this.bloc.debtValue$.value}
            userFarmingTokenAmount={this.bloc.userFarmingTokenAmount$.value}
            userBaseTokenAmount={this.bloc.userBaseTokenAmount$.value}
          />
        )
      case 'convertToBaseToken':
        return !!this.bloc.positionValue$.value && (
          <ConvertToBaseTokenSummary
            poolInfo={poolInfo}
            tokenPrices={tokenPrices}
            farmingToken={farmingToken}
            baseToken={baseToken}
            positionValue={this.bloc.positionValue$.value}
            equityValue={this.bloc.equityValue$.value}
            debtValue={this.bloc.debtValue$.value}
            userFarmingTokenAmount={this.bloc.userFarmingTokenAmount$.value}
            userBaseTokenAmount={this.bloc.userBaseTokenAmount$.value}
          />
        )
    }
  }
    
  render() {
    const { title, farmingToken, baseToken } = this.props
    
    return (
      <div className="ClosePositionPopup">
        <Modal className="ClosePositionPopup__modal" title={title}>
          <div className="ClosePositionPopup">
            <p className="ClosePositionPopup__methodSelectTitle">Closing Method</p>        
            <RadioSet
              className="ClosePositionPopup__radioSet"
              selectedValue={this.bloc.closingMethod$.value}
              list={[
                { title: "Minimize Trading", value: "minimizeTrading" }, 
                { title: `Convert to ${baseToken.title}`, value: "convertToBaseToken" },
              ]}
              setChange={(v) => this.bloc.closingMethod$.next(v)}
            />

            {this.renderSummary()}
          </div>
          <button
            onClick={this.bloc.closePosition}
            className="ClosePositionPopup__closePositionButton"
          >
            Close Position
          </button>
        </Modal>
      </div>
    )
  }
}

export default ClosePositionPopup