import PriorityQueue from 'javascript-priority-queue'

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

window.isValidDecimal = isValidDecimal