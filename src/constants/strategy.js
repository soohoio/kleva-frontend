import { STRATEGIES } from "./address"
import { tokenList } from "./tokens"

export const getStrategy = ({
  strategyType,
  farmingToken,
  baseToken,
  farmingTokenAmount,
  baseTokenAmount,
}) => {
  switch (strategyType) {
    case "ADD": // ADD_BASE_TOKEN_ONLY || ADD_TWO_SIDES_OPTIMAL
      return getAddStrategy({ farmingToken, baseToken, farmingTokenAmount, baseTokenAmount })
    case "LIQUIDATE_STRATEGY":
    case "MINIMIZE_TRADING_STRATEGY":
    case "PARTIAL_LIQUIDATE_STRATEGY":
    case "PARTIAL_MINIMIZE_TRADING_STRATEGY":
      return getCloseStrategy({ strategyType, farmingToken, baseToken, farmingTokenAmount, baseTokenAmount })
  }
}

const getAddStrategy = ({ farmingToken, baseToken, farmingTokenAmount, baseTokenAmount }) => {
  // console.log(farmingToken, 'farmingToken')
  // console.log(baseToken, 'baseToken')
  // console.log(farmingTokenAmount, 'farmingTokenAmount')
  // console.log(baseTokenAmount, 'baseTokenAmount')
  // console.log(isK4PoolStrategy(farmingToken, baseToken), 'isK4PoolStrategy(farmingToken, baseToken)')
  // FarmingTokenAmount Doesn't exist -> AddBaseTokenOnly
  if (farmingTokenAmount == 0) {
    if (isK4PoolStrategy(farmingToken, baseToken)) {
      return { strategyType: "ADD_BASE_TOKEN_ONLY", strategyAddress: STRATEGIES["K4POOL:ADD_BASE_TOKEN_ONLY"] }
    }

    return { strategyType: "ADD_BASE_TOKEN_ONLY", strategyAddress: STRATEGIES["ADD_BASE_TOKEN_ONLY"] }
  }

  // FarmingTokenAmount Exists -> AddTwoSidesOptimal
  if (isK4PoolStrategy(farmingToken, baseToken)) {
    return { strategyType: "ADD_TWO_SIDES_OPTIMAL", strategyAddress: STRATEGIES["K4POOL:ADD_TWO_SIDES_OPTIMAL"] }
  }

  return { strategyType: "ADD_TWO_SIDES_OPTIMAL", strategyAddress: STRATEGIES["ADD_TWO_SIDES_OPTIMAL"] }
}

const getCloseStrategy = ({ strategyType, farmingToken, baseToken }) => {
  if (isK4PoolStrategy(farmingToken, baseToken)) {
    return { strategyType: strategyType, strategyAddress: STRATEGIES["K4POOL:" + strategyType] }
  }
  return { strategyType: strategyType, strategyAddress: STRATEGIES[strategyType] }
}

const K4POOL_STABLE_COINS = [tokenList.oUSDC, tokenList.oUSDT, tokenList.KDAI].map(({ address }) => address)

export const isK4PoolStrategy = (farmingToken, baseToken) => {
  return K4POOL_STABLE_COINS.includes(farmingToken.address) && K4POOL_STABLE_COINS.includes(baseToken.address)
}

window.isK4PoolStrategy = isK4PoolStrategy