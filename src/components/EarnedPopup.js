import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { BehaviorSubject, Subject, merge } from 'rxjs'
import { debounceTime, switchMap, takeUntil, tap } from 'rxjs/operators'

import './EarnedPopup.scss'
import Modal from './common/Modal'
import { debtTokens, ibTokens, tokenList } from '../constants/tokens'
import { fetchWalletInfo$, pendingGT$, selectedAddress$ } from '../streams/wallet'
import { getTransactionReceipt$, harvestFromStakingPool$ } from '../streams/contract'
import { isSameAddress, nFormatter } from '../utils/misc'
import { I18n } from './common/I18n'
import { closeModal$, openModal$ } from '../streams/ui'
import CompletedModal from './common/CompletedModal'

const EarnedItem = ({ title, subtitle, claimReward, rewardToken, earnedAmount, pid }) => {
  return (
    <div className="EarnedItem">
      <div className="EarnedItem__left">
        <img className="EarnedItem__icon" src={tokenList[title].iconSrc} />
        <p className="EarnedItem__title">{title}</p>
        <p className="EarnedItem__subtitle">{subtitle}</p>
      </div>
      <div className="EarnedItem__right">
        <strong>{nFormatter(earnedAmount, 4)}</strong> {rewardToken.title}
        <button onClick={() => claimReward(pid)}  className="EarnedItem__claimButton">{I18n.t('claim')}</button>
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
      switchMap((result) => getTransactionReceipt$(result && result.result || result.tx_hash)),
    ).subscribe((result) => {

      const logs = result.logs.filter(({ address }) => isSameAddress(address, tokenList.KLEVA.address))
      
      const logFiltered = logs.filter(({ data }) => {

        try {
          const _parsed = caver.klay.abi.decodeParameters(
            ['address', 'address', 'uint256'],
            data
          )
          return (_parsed[1] && _parsed[1].toLowerCase() == selectedAddress$.value.toLowerCase())
        } catch (e) {
          return false
        }
      })[0]

      const _parsed = caver.klay.abi.decodeParameters(
        ['address', 'address', 'uint256'],
        logFiltered?.data
      )

      console.log(logs, 'logs')
      console.log(logFiltered, 'logFiltered')
      console.log(_parsed, '_parsed')

      const claimedKLEVA = nFormatter(new BigNumber(_parsed[2]).div(10 ** tokenList.decimals).toNumber(), 2)

      console.log(claimedKLEVA, 'claimedKLEVA')
      
      openModal$.next({ 
        component: (
          <CompletedModal menus={[
            {
              title: I18n.t('confirm'),
              onClick: () => {
                closeModal$.next(true)
              }
            },
          ]}>
            <p className="CompletedModal__title">{I18n.t('tokenClaimed', { title: tokenList.KLEVA.title, amount: claimedKLEVA })}</p>
            <p className="CompletedModal__description">{I18n.t('tokenClaimed.description', { title: tokenList.KLEVA.title })}</p>
          </CompletedModal>
        )
      })

      this.isLoading$.next(false)
      fetchWalletInfo$.next(true)
    })
  }
    
  render() {
    
    return (
      <Modal
        noAnimation
        className="EarnedPopup"
        title={I18n.t('myasset.earned.klevaReward')}
      >
        {Object.values(debtTokens).map(({ title, pid }) => {
          const earnedAmount = new BigNumber(pendingGT$.value[pid]).div(10 ** tokenList["KLEVA"].decimals)
            .toNumber()
          return (
            <EarnedItem 
              title={title}
              subtitle={I18n.t('myasset.earned.leverageReward')}
              pid={pid}
              rewardToken={tokenList["KLEVA"]}
              earnedAmount={earnedAmount}
              claimReward={this.claimReward}
            />
          )
        })}
        {Object.values(ibTokens).map(({ title, pid }) => {
          const earnedAmount = new BigNumber(pendingGT$.value[pid]).div(10 ** tokenList["KLEVA"].decimals)
            .toNumber()
          return (
            <EarnedItem 
              title={title}
              subtitle={I18n.t('myasset.earned.stakingReward')}
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