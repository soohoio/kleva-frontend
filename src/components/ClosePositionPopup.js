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

class ClosePositionPopup extends Component {
  destroy$ = new Subject()
  
  constructor(props) {
    super(props)
    this.bloc = new Bloc(props)
  }
  
  componentDidMount() {
    merge(
      this.bloc.closingMethod$,
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
          <MinimizeTradingSummary />
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