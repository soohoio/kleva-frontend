import React, { Component, Fragment, createRef } from 'react'
import BigNumber from 'bignumber.js'
import cx from 'classnames'
import { Subject, merge, interval, forkJoin } from 'rxjs'
import { takeUntil, tap, switchMap, startWith, debounceTime } from 'rxjs/operators'
import './LendingPoolList.scss'
import { lendingPools, PROTOCOL_FEE } from '../../constants/lendingpool'
import LendingPoolListItem from './LendingPoolListItem'
import { listTokenSupplyInfo$ } from '../../streams/contract'
import { lendingTokenSupplyInfo$, poolAmountInStakingPool$ } from '../../streams/vault'
import { balancesInWallet$, selectedAddress$ } from '../../streams/wallet'
import { isDesktop$, openModal$ } from '../../streams/ui'
import LendingPoolListItemCard from './LendingPoolListItemCard'
import { stakingPoolsByToken } from '../../constants/stakingpool'
import { klevaAnnualRewards$, protocolAPR$ } from '../../streams/farming'
import { tokenPrices$ } from '../../streams/tokenPrice'
import { tokenList } from '../../constants/tokens'
import { isSameAddress } from '../../utils/misc'
import { I18n } from '../common/I18n'
import QuestionMark from '../common/QuestionMark'
import Modal from '../common/Modal'
import LabelAndValue from '../LabelAndValue'

import UtilizationInfoModal from '../modals/UtilizationInfoModal'

const LendingPoolListTableHeader = () => {
  return (
    <div className="LendingPoolListTableHeader">
      <div>{I18n.t('token')}</div>
      <div>{I18n.t('aprapy')}</div>
      <div>{I18n.t('aprDetail')}</div>
      <div>{I18n.t('totalDeposited')}</div>
      <div>
        {I18n.t('utilizationRatio')}
        <QuestionMark 
          onClick={() => {
            openModal$.next({
              component: <UtilizationInfoModal />
            })
          }}
        />
      </div>
      <div>{I18n.t('depositAvailable')}</div>
      <div>&nbsp;</div>
    </div>
  )
}

class LendingPoolList extends Component {
  destroy$ = new Subject()
  
  state = {
    activeIdx: 0,
  }

  componentDidMount() {
    merge(
      isDesktop$,
      lendingTokenSupplyInfo$,
      balancesInWallet$,
      poolAmountInStakingPool$,
      klevaAnnualRewards$,
      tokenPrices$,
      selectedAddress$,
      protocolAPR$,
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
    const { activeIdx } = this.state

    return (
      <div className="LendingPoolList">
        {isDesktop$.value 
          ? (
            <>
              <LendingPoolListTableHeader />
              <div className="LendingPoolList__tableContents">
                {lendingPools.map(({ title, stakingToken, vaultAddress, disabled, controllerDisabled, disabledMessage }, idx) => {

                  const lendingTokenSupplyInfo = lendingTokenSupplyInfo$.value[vaultAddress]
                  
                  const totalSupply = lendingTokenSupplyInfo && lendingTokenSupplyInfo.totalSupply
                  const totalBorrowed = lendingTokenSupplyInfo && lendingTokenSupplyInfo.totalBorrowed
                  const depositedTokenBalance = lendingTokenSupplyInfo && lendingTokenSupplyInfo.depositedTokenBalance
                  const ibTokenPrice = lendingTokenSupplyInfo && lendingTokenSupplyInfo.ibTokenPrice
                  const ibTokenAddress = vaultAddress
                  const originalToken = lendingTokenSupplyInfo && lendingTokenSupplyInfo.ibToken.originalToken

                  const _stakingPool = stakingPoolsByToken[ibTokenAddress]
                  const _stakingPoolPID = _stakingPool && _stakingPool.pid
                  const poolDepositedAmount = poolAmountInStakingPool$.value[_stakingPoolPID] || 0
                  const klevaAnnualReward = klevaAnnualRewards$.value[_stakingPoolPID] || 0
                  const klevaPrice = tokenPrices$.value[tokenList.KLEVA.address.toLowerCase()]
                  const originalTokenPrice = tokenPrices$.value[originalToken && originalToken.address.toLowerCase()]
                  const ibTokenPriceRatio = ibTokenPrice
                  const ibTokenPriceInUSD = originalTokenPrice * ibTokenPriceRatio

                  const tvl = new BigNumber(depositedTokenBalance)
                    .multipliedBy(tokenPrices$.value[stakingToken.address.toLowerCase()])
                    .toNumber()

                  const isKlevaLendingPool = isSameAddress(stakingToken?.address, tokenList.KLEVA.address)

                  const protocolAPR = isKlevaLendingPool 
                    ? protocolAPR$.value
                    : 0

                  const stakingAPR = new BigNumber(klevaAnnualReward)
                    .multipliedBy(klevaPrice)
                    .div((poolDepositedAmount * ibTokenPriceInUSD) || 1)
                    .multipliedBy(100)
                    .toNumber()

                  const utilization = new BigNumber(totalBorrowed)
                    .div(totalSupply)
                    .multipliedBy(100)
                    .toNumber()

                  const borrowingInterest = lendingTokenSupplyInfo$.value &&
                    lendingTokenSupplyInfo$.value[stakingToken.address] &&
                    lendingTokenSupplyInfo$.value[stakingToken.address].borrowingInterest

                  const lendingAPR = new BigNumber(borrowingInterest)
                    .multipliedBy(utilization / 100)
                    .multipliedBy(1 - PROTOCOL_FEE)
                    // .multipliedBy(100)
                    .toNumber()

                  const isLastIdx = idx == lendingPools.length - 1

                  return (
                    <LendingPoolListItem
                      disabled={disabled}
                      controllerDisabled={controllerDisabled}
                      disabledMessage={disabledMessage}
                      selectedAddress={selectedAddress$.value}
                      key={title}
                      balanceInWallet={balancesInWallet$.value[stakingToken.address]}
                      wKLAYBalance={balancesInWallet$.value[tokenList.WKLAY.address]}
                      ibTokenBalanceInWallet={balancesInWallet$.value[ibTokenAddress]}
                      lendingAPR={lendingAPR}
                      stakingAPR={stakingAPR}
                      protocolAPR={protocolAPR}
                      title={title}
                      utilization={utilization}
                      stakingToken={stakingToken}
                      vaultAddress={vaultAddress}
                      totalSupply={totalSupply}
                      totalBorrowed={totalBorrowed}
                      ibTokenPrice={ibTokenPrice}
                      depositedTokenBalance={depositedTokenBalance}
                      tvl={tvl}
                      isLastIdx={isLastIdx}
                    />
                  )
                })}
              </div>
            </>
          )
          : (
            <div className="LendingPoolList__cardContents">
              <LabelAndValue
                className="LendingPoolList__cardContentsHeader"
                label={I18n.t('lendingList')}
                value={`% ${I18n.t('apy')}`}
              />

              <div className="LendingPoolList__list">
                {lendingPools.map(({ title, stakingToken, vaultAddress, disabled, controllerDisabled, disabledMessage }, idx) => {

                  const lendingTokenSupplyInfo = lendingTokenSupplyInfo$.value[vaultAddress]
                  const totalSupply = lendingTokenSupplyInfo && lendingTokenSupplyInfo.totalSupply
                  const totalBorrowed = lendingTokenSupplyInfo && lendingTokenSupplyInfo.totalBorrowed
                  const depositedTokenBalance = lendingTokenSupplyInfo && lendingTokenSupplyInfo.depositedTokenBalance
                  const ibTokenPrice = lendingTokenSupplyInfo && lendingTokenSupplyInfo.ibTokenPrice
                  const ibTokenAddress = vaultAddress
                  const originalToken = lendingTokenSupplyInfo && lendingTokenSupplyInfo.ibToken.originalToken

                  const _stakingPool = stakingPoolsByToken[ibTokenAddress]
                  const _stakingPoolPID = _stakingPool && _stakingPool.pid
                  const poolDepositedAmount = poolAmountInStakingPool$.value[_stakingPoolPID] || 0
                  const klevaAnnualReward = klevaAnnualRewards$.value[_stakingPoolPID] || 0
                  const klevaPrice = tokenPrices$.value[tokenList.KLEVA.address.toLowerCase()]
                  const originalTokenPrice = tokenPrices$.value[originalToken && originalToken.address.toLowerCase()]
                  const ibTokenPriceRatio = ibTokenPrice
                  const ibTokenPriceInUSD = originalTokenPrice * ibTokenPriceRatio

                  const tvl = new BigNumber(depositedTokenBalance)
                    .multipliedBy(tokenPrices$.value[stakingToken.address.toLowerCase()])
                    .toNumber()

                  const isKlevaLendingPool = isSameAddress(stakingToken?.address, tokenList.KLEVA.address)

                  const protocolAPR = isKlevaLendingPool
                    ? protocolAPR$.value
                    : 0

                  const stakingAPR = new BigNumber(klevaAnnualReward)
                    .multipliedBy(klevaPrice)
                    .div((poolDepositedAmount * ibTokenPriceInUSD) || 1)
                    .multipliedBy(100)
                    .toNumber()

                  const utilization = new BigNumber(totalBorrowed)
                    .div(totalSupply)
                    .multipliedBy(100)
                    .toNumber()

                  const borrowingInterest = lendingTokenSupplyInfo$.value &&
                    lendingTokenSupplyInfo$.value[stakingToken.address] &&
                    lendingTokenSupplyInfo$.value[stakingToken.address].borrowingInterest

                  const lendingAPR = new BigNumber(borrowingInterest)
                    .multipliedBy(utilization / 100)
                    .multipliedBy(1 - PROTOCOL_FEE)
                    // .multipliedBy(100)
                    .toNumber()

                  return (
                    <LendingPoolListItemCard
                      disabled={disabled}
                      controllerDisabled={controllerDisabled}
                      disabledMessage={disabledMessage}
                      key={title}
                      selectedAddress={selectedAddress$.value}
                      isExpand={activeIdx == idx}
                      onClick={() => this.setState({ activeIdx: activeIdx == idx ? null : idx })}
                      balanceInWallet={balancesInWallet$.value[stakingToken.address]}
                      wKLAYBalance={balancesInWallet$.value[tokenList.WKLAY.address]}
                      ibTokenBalanceInWallet={balancesInWallet$.value[ibTokenAddress]}
                      title={title}
                      stakingToken={stakingToken}
                      vaultAddress={vaultAddress}
                      protocolAPR={protocolAPR}
                      totalSupply={totalSupply}
                      totalBorrowed={totalBorrowed}
                      ibTokenPrice={ibTokenPrice}
                      depositedTokenBalance={depositedTokenBalance}
                      utilization={utilization}
                      lendingAPR={lendingAPR}
                      stakingAPR={stakingAPR}
                      tvl={tvl}
                    />
                  )
                })}
              </div>
            </div>
          )
        }
      </div>
    )
  }
}

export default LendingPoolList