import PriorityQueue from 'javascript-priority-queue'
import { getIbTokenFromOriginalToken } from '../constants/tokens'
import { isSameAddress } from './misc'

export const getBufferedLeverage = (workFactorBps) => {
  // const buffered = (workFactorBps - 100) / 0.99
  const buffered = (workFactorBps - 300) / 0.97
  
  return 10000 / (10000 - Number(buffered))
}

export const calcKlevaRewardsAPR = ({
  lendingTokenSupplyInfo,
  borrowingAsset,
  debtTokens,
  klevaAnnualRewards,
  klevaTokenPrice,
  leverage,
}) => {
  const ibToken = getIbTokenFromOriginalToken(borrowingAsset)
  const debtToken = debtTokens[ibToken.address] || debtTokens[ibToken.address.toLowerCase()]
  const debtTokenPid = debtToken && debtToken.pid
  const klevaAnnualRewardForDebtToken = klevaAnnualRewards[debtTokenPid]

  const _tokenInfo = lendingTokenSupplyInfo && lendingTokenSupplyInfo[borrowingAsset.address.toLowerCase()]
  const _debtTokenInfo = _tokenInfo && _tokenInfo.debtTokenInfo

  const klevaRewardsAPR = new BigNumber(klevaAnnualRewardForDebtToken)
    .multipliedBy(klevaTokenPrice)
    .div(_tokenInfo && _tokenInfo.debtTokenTotalSupply)
    .multipliedBy(10 ** (_debtTokenInfo && _debtTokenInfo.decimals) / 10 ** borrowingAsset.decimals)
    .multipliedBy(leverage - 1)
    .multipliedBy(100)
    .toNumber()

  return klevaRewardsAPR || 0
}

export const toAPY = (apr) => {
  return ((1 + (apr / 365 / 100)) ** 365 - 1) * 100
}

export const toFixed = (num, fixed) => {
  var re = new RegExp('^-?\\d+(?:\.\\d{0,' + (fixed || -1) + '})?');
  return num.toString().match(re)[0];
}

export const isValidDecimal = (num, decimalLimit) => {
  const splitted = String(num).split('.')

  const decimalPoints = splitted[1]
  if (!decimalPoints) return num

  return decimalPoints.length <= decimalLimit
}

export const getEachTokenBasedOnLPShare = ({ 
  poolInfo, 
  lpShare,
  farmingToken,
  baseToken,
}) => {

  if (poolInfo && !poolInfo.supply) return { 
    userFarmingTokenAmount: 0,
    userBaseTokenAmount: 0,
  }

  const lpPortion = new BigNumber(lpShare)
    .div(poolInfo && poolInfo.supply)
    .toNumber()

  const userFarmingTokenAmountPure = (poolInfo && poolInfo.tokenA && poolInfo.tokenA.toLowerCase()) === farmingToken.address.toLowerCase()
    ? new BigNumber(poolInfo.amountA)
      .multipliedBy(lpPortion)
      .toNumber()
    : new BigNumber(poolInfo.amountB)
      .multipliedBy(lpPortion)
      .toNumber()

  const userBaseTokenAmountPure = (poolInfo && poolInfo.tokenA && poolInfo.tokenA.toLowerCase()) === baseToken.address.toLowerCase()
    ? new BigNumber(poolInfo.amountA)
      .multipliedBy(lpPortion)
      .toNumber()
    : new BigNumber(poolInfo.amountB)
      .multipliedBy(lpPortion)
      .toNumber()

    return {
      userFarmingTokenAmount: new BigNumber(userFarmingTokenAmountPure).div(10 ** farmingToken.decimals).toNumber(),
      userBaseTokenAmount: new BigNumber(userBaseTokenAmountPure).div(10 ** baseToken.decimals).toNumber(),

      userFarmingTokenAmountPure,
      userBaseTokenAmountPure,
    }
}

// 
export const getLPAmountBasedOnIngredientsToken = ({ poolInfo, token1, token2 }) => {
  const lpTotalSupply = poolInfo?.supply
  const reserveA = poolInfo?.amountA
  const reserveB = poolInfo?.amountB

  // const tokenA = isSameAddress(poolInfo?.tokenA, token1.address) 
  //   ? token1
  //   : token2

  // const tokenB = isSameAddress(poolInfo?.tokenB, token2.address)
  //   ? token2
  //   : token1

  const amountA = isSameAddress(poolInfo?.tokenA, token1.address)
    ? token1.amount
    : token2.amount
  
  const amountB = isSameAddress(poolInfo?.tokenB, token2.address)
    ? token2.amount
    : token1.amount

  const bPriceInA = new BigNumber(reserveA).div(reserveB)
  
  // the price of amountB in tokenA
  const amountBInTokenA = new BigNumber(amountB).multipliedBy(bPriceInA)

  const allValueInTokenA = new BigNumber(amountA)
    .plus(amountBInTokenA)

  const lpShare = new BigNumber(lpTotalSupply)
    .multipliedBy(allValueInTokenA)
    .div(reserveA)
    .div(2)
    .toNumber()

  return lpShare
}

window.isValidDecimal = isValidDecimal
