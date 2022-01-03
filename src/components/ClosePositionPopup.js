import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import Modal from 'components/common/Modal'

import './ClosePositionPopup.scss'
import ConvertToBaseTokenSummary from './ConvertToBaseTokenSummary'

import Bloc from './ClosePositionPopup.bloc'
import MinimizeTradingSummary from './MinimizeTradingSummary'

import RadioSet from 'components/common/RadioSet'
import { positions$ } from '../streams/farming'

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
      this.bloc.closingMethod$,
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })

    merge(positions$).pipe(
      tap(() => {
        const positions = positions$.value
        const positionInfo = positions && positions.find(({ id }) => id == this.props.positionId)

        const positionValue = positionInfo && positionInfo.positionValue
        const debtValue = positionInfo && positionInfo.debtValue
        const equityValue = positionInfo && new BigNumber(positionInfo.positionValue).minus(debtValue)

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

        this.bloc.positionValue$.next(positionValueParsed)
        this.bloc.equityValue$.next(equityValueParsed)
        this.bloc.debtValue$.next(debtValueParsed)
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
    const { title, farmingToken, baseToken } = this.props

    // TODO: borrowingAsset props
    switch (this.bloc.closingMethod$.value) {
      case 'minimizeTrading':
        return (
          <MinimizeTradingSummary
            baseToken={baseToken}
            farmingToken={farmingToken}
            positionValue$={this.bloc.positionValue$}
            equityValue$={this.bloc.equityValue$}
            debtValue$={this.bloc.debtValue$}
          />
        )
      case 'convertToBaseToken':
        return (
          <ConvertToBaseTokenSummary
            farmingToken={farmingToken}
            baseToken={baseToken}
            borrowingAsset={farmingToken}
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