import React, { Component, Fragment, createRef } from 'react'
import BigNumber from 'bignumber.js'
import cx from 'classnames'
import { BehaviorSubject, Subject, merge } from 'rxjs'
import { debounceTime, switchMap, takeUntil, tap } from 'rxjs/operators'

import './EarnedPopup.scss'
import Modal from '../common/Modal'
import { debtTokens, getOriginalTokenFromIbToken, ibTokens, tokenList } from '../../constants/tokens'
import { fetchWalletInfo$, pendingGT$, selectedAddress$ } from '../../streams/wallet'
import { caver, getTransactionReceipt$, harvestFromStakingPool$ } from '../../streams/contract'
import { isSameAddress, nFormatter, noRounding, padAddress } from '../../utils/misc'
import { I18n } from '../common/I18n'
import { stakingPools } from '../../constants/stakingpool'
import { closeModal$, openModal$ } from '../../streams/ui'
import CompletedModal from '../common/CompletedModal'

const EarnedItem = ({ isLoading, title, subtitle, claimReward, rewardToken, earnedAmount, pid }) => {
  return (
    <div className="EarnedItem">
      <img className="EarnedItem__icon" src={tokenList[title].iconSrc} />
      <div className="EarnedItem__content">
        <div className="EarnedItem__left">
          <div className="EarnedItem__titleWrapper">
            <p className="EarnedItem__title">{title}</p>
            <p className="EarnedItem__subtitle">{subtitle}</p>
          </div>
        </div>
        <div className="EarnedItem__right">
          <strong>{nFormatter(earnedAmount, 4)}</strong>
          <button onClick={() => claimReward(pid)} className="EarnedItem__claimButton">
            {isLoading 
              ? "..."
              : I18n.t('claim')
            }
          </button>
        </div>
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
      this.isLoading$,
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
      tap(() => {
        this.isLoading$.next(true)
      }),
      switchMap((result) => getTransactionReceipt$(result && result.result || result.tx_hash)),
    ).subscribe((result) => {

      const log = result.logs.filter(({ address, topics }) => {
        return isSameAddress(address, tokenList.KLEVA.address) && 
          topics && 
          topics[2] && 
          topics[2].toLowerCase() == padAddress(selectedAddress$.value).toLowerCase()
      })[0]
      
      const _parsed = caver.klay.abi.decodeParameters(
        ['uint256'],
        log.data
      )

      const claimedKLEVA = noRounding(new BigNumber(_parsed[0]).div(10 ** tokenList.KLEVA.decimals).toNumber(), 4)

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
        className="EarnedPopup"
        title={I18n.t('myasset.earned.klevaReward')}
      >
        {Object.values(debtTokens)
          .filter(({ pid }) => {
            const earnedAmount = new BigNumber(pendingGT$.value[pid] || 0)
              .div(10 ** tokenList["KLEVA"].decimals)
              .toNumber()

            console.log(earnedAmount, 'earnedAmount 1')

            // return earnedAmount != 0
            return earnedAmount >= 0.0001
          })
          .map(({ title, pid }) => {
          const earnedAmount = new BigNumber(pendingGT$.value[pid] || 0)
            .div(10 ** tokenList["KLEVA"].decimals)
            .toNumber()

          return (
            <EarnedItem
              isLoading={this.isLoading$.value}
              title={title}
              subtitle={I18n.t('myasset.earned.leverageReward')}
              pid={pid}
              rewardToken={tokenList["KLEVA"]}
              earnedAmount={earnedAmount}
              claimReward={this.claimReward}
            />
          )
        })}
        {stakingPools
          .filter(({ pid }) => {
            const earnedAmount = new BigNumber(pendingGT$.value[pid] || 0)
              .div(10 ** tokenList["KLEVA"].decimals)
              .toNumber()
            console.log(earnedAmount, 'earnedAmount 2')

            // return earnedAmount != 0
            return earnedAmount >= 0.0001
          })
          .map(({ title, stakingToken, pid }) => {
            const earnedAmount = new BigNumber(pendingGT$.value[pid] || 0)
              .div(10 ** tokenList["KLEVA"].decimals)
              .toNumber()

            const originalToken = getOriginalTokenFromIbToken(stakingToken)

            return (
              <EarnedItem
                isLoading={this.isLoading$.value}
                title={originalToken?.title}
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