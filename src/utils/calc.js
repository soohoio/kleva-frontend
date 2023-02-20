import PriorityQueue from 'javascript-priority-queue'
import { getIbTokenFromOriginalToken } from '../constants/tokens'
import { addressKeyFind, isSameAddress } from './misc'

export const getBufferedWorkFactorBps = (workFactorBps) => {
  return (workFactorBps - 300) / 0.97
}

export const getBufferedLeverage = (workFactorBps) => {
  // const buffered = (workFactorBps - 100) / 0.99
  const buffered = (workFactorBps - 300) / 0.97
  
  return 10000 / (10000 - Math.round(Number(buffered)))
}

export const getWorkFactorBpsFromLeverage = (leverage) => {
  return Number(10000 - (10000 / Number(leverage))).toFixed(0)
}

export const calcKlevaRewardsAPR = ({
  lendingTokenSupplyInfo,
  borrowingAsset,
  debtTokens,
  klevaAnnualRewards,
  klevaTokenPrice,
  leverage,
  tokenPrices,

  borrowingDelta = 0,
}) => {

  const ibToken = getIbTokenFromOriginalToken(borrowingAsset)
  const debtToken = debtTokens[ibToken.address] || debtTokens[ibToken.address.toLowerCase()]
  const debtTokenPid = debtToken && debtToken.pid
  const klevaAnnualRewardForDebtToken = klevaAnnualRewards[debtTokenPid]

  const _tokenInfo = lendingTokenSupplyInfo?.[borrowingAsset.address.toLowerCase()]
  const originalToken = _tokenInfo?.originalToken
  const ibTokenPrice = _tokenInfo?.ibTokenPrice

  const ibTokenInfo = addressKeyFind(lendingTokenSupplyInfo, ibToken.address)

  const debtTokenPriceInUSD = new BigNumber(ibTokenPrice)
    .multipliedBy(tokenPrices && tokenPrices[originalToken?.address?.toLowerCase()])
    .toNumber()

  const _debtTokenInfo = _tokenInfo && _tokenInfo.debtTokenInfo

  const klevaRewardsAPR = new BigNumber(klevaAnnualRewardForDebtToken)
    .multipliedBy(klevaTokenPrice)
    .div(
      new BigNumber(ibTokenInfo.totalBorrowed)
        .plus(borrowingDelta || 0)
        .multipliedBy(debtTokenPriceInUSD)
        // .div(10 ** borrowingAsset.decimals)
    )
    .multipliedBy(leverage - 1)
    .multipliedBy(100)
    .toNumber()

  return klevaRewardsAPR || 0
}

export const calcProtocolAPR = ({ ibKlevaTotalSupplyTVL, aprInfo, farmPoolDeposited = [] }) => {
  const protocolAPRNumerator = farmPoolDeposited.reduce((acc, { lpToken, deposited }) => {
    const lpPool = lpToken?.address
    const apr = addressKeyFind(aprInfo, lpPool)
    const yieldFarmingAPR = (apr?.miningAPR || 0) + (apr?.airdropAPR || 0)

    const PERCENTAGE_FOR_KLEVA_STAKER = 0.1

    return acc + (deposited * yieldFarmingAPR * PERCENTAGE_FOR_KLEVA_STAKER)
  }, 0)

  const protocolAPRDenominator = ibKlevaTotalSupplyTVL

  return protocolAPRNumerator / protocolAPRDenominator
}

export const toAPY = (apr) => {
  const apy = ((1 + (apr / 365 / 100)) ** 365 - 1) * 100
  return String(apy).length > 20 ? Infinity : apy
}

export const toFixed = (num, fixed) => {
  var re = new RegExp('^-?\\d+(?:\.\\d{0,' + (fixed || -1) + '})?');

  const matched = num.toString().match(re)

  return matched && matched[0];
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
  totalShare,
  totalStakedLpBalance,
}) => {

  if (poolInfo && !poolInfo.supply) return {
    userFarmingTokenAmount: 0,
    userBaseTokenAmount: 0,
  }

  const lpPortion = new BigNumber(lpShare)
    .div(totalShare)
    .toNumber()

  const lpAmount = new BigNumber(totalStakedLpBalance)
    .multipliedBy(lpPortion)
    .toFixed(0)

  const portion = new BigNumber(lpAmount)
    .div(poolInfo?.supply)
    .toString()

  const userFarmingTokenAmountPure = (poolInfo && poolInfo.tokenA && poolInfo.tokenA.toLowerCase()) === farmingToken.address.toLowerCase()
    ? new BigNumber(poolInfo?.amountA)
      .multipliedBy(portion)
      .toNumber()
    : new BigNumber(poolInfo?.amountB)
      .multipliedBy(portion)
      .toNumber()

  const userBaseTokenAmountPure = (poolInfo && poolInfo.tokenA && poolInfo.tokenA.toLowerCase()) === baseToken.address.toLowerCase()
    ? new BigNumber(poolInfo?.amountA)
      .multipliedBy(portion)
      .toNumber()
    : new BigNumber(poolInfo?.amountB)
      .multipliedBy(portion)
      .toNumber()

  return {
    userFarmingTokenAmount: new BigNumber(userFarmingTokenAmountPure).div(10 ** farmingToken.decimals).toNumber(),
    userBaseTokenAmount: new BigNumber(userBaseTokenAmountPure).div(10 ** baseToken.decimals).toNumber(),

    userFarmingTokenAmountPure,
    userBaseTokenAmountPure,
    lpAmount,
  }
}

// 
export const getLPAmountBasedOnIngredientsToken = ({ poolInfo, token1, token2 }) => {
  const lpTotalSupply = poolInfo?.supply
  const reserveA = poolInfo?.amountA
  const reserveB = poolInfo?.amountB

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
    .toString()

  return lpShare
}

window.isValidDecimal = isValidDecimal

const DENOM = 10 ** 18;
const CEIL_SLOPE_1 = 60 * DENOM;
const CEIL_SLOPE_2 = 90 * DENOM;
const CEIL_SLOPE_3 = 100 * DENOM;
const MAX_INTEREST_SLOPE_1 = (20 * DENOM) / 100;
const MAX_INTEREST_SLOPE_2 = (20 * DENOM) / 100;
const MAX_INTEREST_SLOPE_3 = (150 * DENOM) / 100;

export const calcInterestRate = (debt, floating) => {
  if (debt == 0 && floating == 0) return 0

  const total = new BigNumber(debt).plus(floating).toString()
  const utilization = new BigNumber(debt)
    .multipliedBy(100)
    .multipliedBy(DENOM)
    .div(total)
    .toString()

  const DAYS_365 = 86400 * 365

  if (new BigNumber(utilization).lt(CEIL_SLOPE_1)) {
    return new BigNumber(utilization)
      .multipliedBy(MAX_INTEREST_SLOPE_1)
      .div(CEIL_SLOPE_1)
      .div(DAYS_365)
      .toString()
  } else if (new BigNumber(utilization).lt(CEIL_SLOPE_2)) {
    return new BigNumber(MAX_INTEREST_SLOPE_2).div(DAYS_365).toString()
  } else if (new BigNumber(utilization).lt(CEIL_SLOPE_3)) {

    const m1 = new BigNumber(MAX_INTEREST_SLOPE_2)
    const m2 = new BigNumber(utilization).minus(CEIL_SLOPE_2)
    const m3 = new BigNumber(MAX_INTEREST_SLOPE_3).minus(MAX_INTEREST_SLOPE_2)
    const m4 = new BigNumber(CEIL_SLOPE_3).minus(CEIL_SLOPE_2)

    return m1.plus(m2.multipliedBy(m3)).div(m3).div(m4)
      .div(DAYS_365)
      .toString()
  } else {
    return new BigNumber(MAX_INTEREST_SLOPE_3)
      .div(DAYS_365)
      .toString()
  }
}

window.calcInterestRate = calcInterestRate

export const optimalDeposit = (amtA, amtB, resA, resB) => {

  const a = new BigNumber(amtA).multipliedBy(resB)
  const b = new BigNumber(amtB).multipliedBy(resA)
  
  let swapAmt
  let isReversed

  if (a.gte(b)) {
    swapAmt = _optimalDepositA(amtA, amtB, resA, resB);
    isReversed = false;
  } else {
    swapAmt = _optimalDepositA(amtB, amtA, resB, resA);
    isReversed = true;
  }

  return {
    isReversed,
    swapAmt,
  }
}

export const _optimalDepositA = (amtA, amtB, resA, resB) => {
  const FEE_BPS = 30 // 0.3%
  const FEE_FACTOR = (10 ** 4) - FEE_BPS
  const FEE_CONST1 = (10 ** 4) + FEE_FACTOR

  const a = FEE_FACTOR
  const b = new BigNumber(FEE_CONST1).multipliedBy(resA).toString()

  amtA = amtA || 0
  amtB = amtB || 0
  resA = resA || 0
  resB = resB || 0

  const _c = new BigNumber(amtA)
    .multipliedBy(resB)
    .minus(
      new BigNumber(amtB).multipliedBy(resA)
    ).toString()

  const c = (new BigNumber(_c).multipliedBy(10 ** 4)).div(new BigNumber(amtB).plus(resB)).multipliedBy(resA).toString()
  const d = new BigNumber(a).multipliedBy(c).multipliedBy(4).toString()
  const e = new BigNumber(b).multipliedBy(b).plus(d).sqrt().toFixed(0)

  const numerator = new BigNumber(e).minus(b).toString()
  const denominator = new BigNumber(a).multipliedBy(2).toString()

  const result = new BigNumber(numerator).dividedBy(denominator).toFixed(0)

  return result
}

// Calculate same value of other side token without "swap", 
export const getOptimalAmount = (amtA, resA, resB) => {
  const result = new BigNumber(amtA)
    .multipliedBy(resB)
    .div(resA)
    .toFixed(0)

  return result
}