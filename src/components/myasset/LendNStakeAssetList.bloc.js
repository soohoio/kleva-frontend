import { BehaviorSubject, Subject, forkJoin } from 'rxjs'
import { takeUntil, tap, switchMap, map } from 'rxjs/operators'

import { getOriginalTokenFromIbToken, ibTokenByAddress, ibTokens, tokenList } from '../../constants/tokens'
import { balancesInStakingPool$, balancesInWallet$ } from '../../streams/wallet'
import { tokenPrices$ } from '../../streams/tokenPrice'
import { lendingTokenSupplyInfo$, poolAmountInStakingPool$ } from '../../streams/vault'
import { klevaAnnualRewards$, protocolAPR$ } from '../../streams/farming'
import { stakingPoolsByToken } from '../../constants/stakingpool'
import { PROTOCOL_FEE } from '../../constants/lendingpool'
import { isSameAddress } from '../../utils/misc'

export default class {
  constructor(comp) {
    this.comp = comp
    
  } 

  getLendNStakeValue = () => {
    const ibTokenBalances = ibTokens && Object
      .values(ibTokens)
      .reduce((acc, cur) => {
        

        // balance
        const balanceInWallet = balancesInWallet$.value[cur.address] && balancesInWallet$.value[cur.address].balanceParsed
        const balanceInStaking = balancesInStakingPool$.value[cur.address] && balancesInStakingPool$.value[cur.address].balanceParsed
        const balanceTotal = new BigNumber(balanceInWallet).plus(balanceInStaking).toNumber()
        const originalToken = getOriginalTokenFromIbToken(ibTokenByAddress[cur.address.toLowerCase()])

        const originalTokenPrice = tokenPrices$.value[originalToken.address.toLowerCase()]

        // apr
        const lendingTokenSupplyInfo = lendingTokenSupplyInfo$.value?.[cur.address]

        const totalSupply = lendingTokenSupplyInfo && lendingTokenSupplyInfo.totalSupply
        const totalBorrowed = lendingTokenSupplyInfo && lendingTokenSupplyInfo.totalBorrowed
        const ibTokenAddress = cur.address

        const _stakingPool = stakingPoolsByToken[ibTokenAddress]
        const _stakingPoolPID = _stakingPool && _stakingPool.pid
        const poolDepositedAmount = poolAmountInStakingPool$.value[_stakingPoolPID]
        const klevaAnnualReward = klevaAnnualRewards$.value[_stakingPoolPID]
        const klevaPrice = tokenPrices$.value[tokenList.KLEVA.address.toLowerCase()]
        const ibTokenPrice = lendingTokenSupplyInfo?.ibTokenPrice
        const ibTokenPriceInUSD = originalTokenPrice * ibTokenPrice

        const isKlevaLendingPool = isSameAddress(originalToken.address, tokenList.KLEVA.address)

        const protocolAPR = isKlevaLendingPool
          ? protocolAPR$.value
          : 0

        const stakingAPR = new BigNumber(klevaAnnualReward)
          .multipliedBy(klevaPrice)
          .div(poolDepositedAmount * ibTokenPriceInUSD)
          .multipliedBy(100)
          .toNumber()

        const utilization = new BigNumber(totalBorrowed)
          .div(totalSupply)
          .multipliedBy(100)
          .toNumber()

        const borrowingInterest = lendingTokenSupplyInfo$.value &&
          lendingTokenSupplyInfo$.value[originalToken.address] &&
          lendingTokenSupplyInfo$.value[originalToken.address].borrowingInterest

        const lendingAPR = new BigNumber(borrowingInterest)
          .multipliedBy(utilization / 100)
          .multipliedBy(1 - PROTOCOL_FEE)
          .toNumber()

        const tradeableValue = new BigNumber(ibTokenPrice)
          .multipliedBy(balanceTotal)
          .toNumber()

        const balanceTotalInUSD = new BigNumber(balanceTotal)
          .multipliedBy(originalTokenPrice)
          .multipliedBy(ibTokenPrice)
          .toNumber()

        // accumulate which has balances
        if (balanceTotal == 0 || isNaN(balanceTotal)) return acc

        const stakingPercentage = (balanceInStaking / balanceTotal) * 100

        const totalAPR = new BigNumber(lendingAPR)
          .plus(stakingAPR)
          .plus(protocolAPR)
          .toNumber()

        acc.push({
          ...cur,
          stakingToken: cur,
          originalToken,
          lendingAPR,
          stakingAPR,
          protocolAPR,
          totalAPR,
          stakingPercentage,
          tradeableValue,
          balanceInWallet,
          balanceInStaking,
          balanceTotal,
          balanceTotalInUSD,
          ibTokenPrice,
        })

        return acc
      }, [])

    const totalInUSD = ibTokenBalances.reduce((acc, cur) => {
      return new BigNumber(acc).plus(cur.balanceTotalInUSD).toNumber()
    }, 0)

    return {
      ibTokenBalances: ibTokenBalances.sort((a, b) => {
        const a_percentage = new BigNumber(a.balanceTotalInUSD)
          .div(totalInUSD)
          .multipliedBy(100)
          .toNumber()

        const b_percentage = new BigNumber(b.balanceTotalInUSD)
          .div(totalInUSD)
          .multipliedBy(100)
          .toNumber()

        return b_percentage - a_percentage
      }),
      totalInUSD,
    }
  }
} 
