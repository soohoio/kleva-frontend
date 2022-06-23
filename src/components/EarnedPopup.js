import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { BehaviorSubject, Subject, merge } from 'rxjs'
import { debounceTime, switchMap, takeUntil, tap } from 'rxjs/operators'

import './EarnedPopup.scss'
import Modal from './common/Modal'
import { debtTokens, tokenList } from '../constants/tokens'
import { fetchWalletInfo$, pendingGT$ } from '../streams/wallet'
import { getTransactionReceipt$, harvestFromStakingPool$ } from '../streams/contract'
import { nFormatter } from '../utils/misc'

const EarnedItem = ({ pairsTitle, claimReward, rewardToken, earnedAmount, pid }) => {
  return (
    <div className="EarnedItem">
      <div className="EarnedItem__left">
        <img className="EarnedItem__icon" src={tokenList[pairsTitle].iconSrc} />
        Rewards from positions on {pairsTitle} pairs
      </div>
      <div className="EarnedItem__right">
        <strong>{nFormatter(earnedAmount, 4)}</strong> {rewardToken.title}
        <button onClick={() => claimReward(pid)}  className="EarnedItem__claimButton">Claim</button>
      </div>
    </div>
  )
}

class EarnedPopup extends Component {
  destroy$ = new Subject()
  isLoading$ = new BehaviorSubject()
  
  componentDidMount() {
    merge(
      pendingGT$,
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

  claimReward = (pid) => {
    harvestFromStakingPool$(pid).pipe(
      switchMap((result) => getTransactionReceipt$(result && result.result || result.tx_hash))
    ).subscribe(() => {
      this.isLoading$.next(false)
      fetchWalletInfo$.next(true)
    })
  }
    
  render() {
    
    return (
      <Modal
        className="EarnedPopup"
        title="Claim Rewards" 
      >
        {Object.values(debtTokens).map(({ title, pid }) => {
          const earnedAmount = new BigNumber(pendingGT$.value[pid]).div(10 ** tokenList["KLEVA"].decimals)
            .toNumber()
          return (
            <EarnedItem 
              pairsTitle={title}
              pid={pid}
              rewardToken={tokenList["KLEVA"]}
              earnedAmount={earnedAmount}
              claimReward={this.claimReward}
            />
          )
        })}
      </Modal>
    )
  }
}

export default EarnedPopup