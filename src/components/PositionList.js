import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { debounceTime, takeUntil, tap } from 'rxjs/operators'
import BigNumber from 'bignumber.js'

import './PositionList.scss'
import { isDesktop$, openModal$ } from '../streams/ui'
import PositionItem from './PositionItem'
import ClosePositionPopup from './ClosePositionPopup'
import { aprInfo$, klevaAnnualRewards$, workerInfo$ } from '../streams/farming'
import KilledPositionItem from './KilledPositionItem'
import { lendingTokenSupplyInfo$ } from '../streams/vault'
import { tokenPrices$ } from '../streams/tokenPrice'
import PositionItemCard from './PositionItemCard'
import KilledPositionItemCard from './KilledPositionItemCard'

class PositionList extends Component {
  destroy$ = new Subject()
  
  state = {
    activeId: 0,
  }

  componentDidMount() {
    merge(
      isDesktop$,
      aprInfo$,
      workerInfo$,
      lendingTokenSupplyInfo$,
      tokenPrices$,
      klevaAnnualRewards$,
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

  // Mobile Only
  expandCard = (id) => {
    this.setState({ activeId: id })
  }

  renderPositionItem = ({
    positionInfo,
    lendingTokenSupplyInfo,
    tokenPrices,
    klevaAnnualRewards,
    aprInfo,
    workerInfo,
    idx,
  }) => {
    const { activeId } = this.state
    if (!isDesktop$.value) {

      return (
        <PositionItemCard 
          key={positionInfo && positionInfo.id}
          lendingTokenSupplyInfo={lendingTokenSupplyInfo$.value}
          tokenPrices={tokenPrices$.value}
          klevaAnnualRewards={klevaAnnualRewards$.value}
          aprInfo={aprInfo}
          workerInfo={workerInfo}
          isExpand={activeId === positionInfo?.id}
          onClick={() => {
            this.expandCard(activeId === positionInfo?.id 
              ? null
              : positionInfo?.id
            )
          }}
          {...positionInfo}
        />
      )
    }

    return (
      <PositionItem
        key={positionInfo && positionInfo.id}
        lendingTokenSupplyInfo={lendingTokenSupplyInfo$.value}
        tokenPrices={tokenPrices$.value}
        klevaAnnualRewards={klevaAnnualRewards$.value}
        aprInfo={aprInfo}
        workerInfo={workerInfo}
        {...positionInfo}
      />
    )
  }

  renderKilledPositionItem = ({ positionInfo }) => {
    if (!isDesktop$.value) {
      return (
        <KilledPositionItemCard 
          key={positionInfo && positionInfo.id}
          {...positionInfo}
        />
      )
    }

    return (
      <KilledPositionItem
        key={positionInfo && positionInfo.id}
        {...positionInfo}
      />
    )
  }
    
  render() {
    const { list, view } = this.props

    return (
      <div className={cx("PositionList", {
        "PositionList--killed": view === "liquidated",
      })}>
        {/* Header */}
        {view === "active" 
          ? (
            <div className="PositionList__header">
              <div className="PositionList__headerNumber">#</div>
              <div className="PositionList__headerPool">Pool</div>
              <div className="PositionList__headerPositionValue">Position Value</div>
              <div className="PositionList__headerDebtValue">Debt Value</div>
              <div className="PositionList__headerEquityValue">Equity Value</div>
              <div className="PositionList__headerCurrentAPY">Current APY</div>
              <div className="PositionList__headerDebtRatio">Debt Ratio</div>
              <div className="PositionList__headerLiquidationThreshold">Liquidation Threshold</div>
              <div className="PositionList__headerSafetyBuffer">Safety Buffer</div>
              <div className="PositionList__headerBlank"></div>
            </div>
          )
          : (
            <div className="PositionList__header">
              <div className="PositionList__headerNumber">#</div>
              <div className="PositionList__headerPool">Pool</div>
              <div className="PositionList__headerDebtValue">Debt size at liquidation</div>
              <div className="PositionList__headerPositionValue">Position size at liquidation</div>
              <div className="PositionList__headerReturnedAmount">Returned amount</div>
              <div className="PositionList__headerTxRecord">Tx Record</div>
            </div>
          )
        }
        <div className="PositionList__content">
          {/* Content */}
          {list
            .filter((positionInfo) => positionInfo?.positionValue != 0)
            .map((positionInfo, idx) => {

              const aprInfo = aprInfo$.value[positionInfo.lpToken.address] || aprInfo$.value[positionInfo.lpToken.address.toLowerCase()]
              const workerInfo = workerInfo$.value[positionInfo.workerAddress] || workerInfo$.value[positionInfo.workerAddress.toLowerCase()]

              return view === "active" 
                ? this.renderPositionItem({
                    positionInfo,
                    lendingTokenSupplyInfo: lendingTokenSupplyInfo$.value,
                    tokenPrices: tokenPrices$.value,
                    klevaAnnualRewards: klevaAnnualRewards$.value,
                    aprInfo,
                    workerInfo,
                    idx,
                  })
                : this.renderKilledPositionItem({ positionInfo })
            })}
        </div>
      </div>
    )
  }
}

export default PositionList