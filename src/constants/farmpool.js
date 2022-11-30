import { lpTokenByIngredients } from "./tokens"
import { workers, workersBy } from "./workers"
import { lendingPoolsByStakingTokenAddress } from './lendingpool';

const makeFarm = (token1, token2) => {

  const workerList = workersBy(token1, token2)

  const defaultBorrowingAsset = [token1, token2].filter(({ address }) => {
    const hasLendingPool = !!lendingPoolsByStakingTokenAddress[address.toLowerCase()]
    return hasLendingPool
  })[0]

  return {
    token1,
    token2,
    lpToken: lpTokenByIngredients(token1, token2),
    workerList: workerList,
    defaultBorrowingAsset,
    exchange: workerList[0].exchange,
  }
}

const makeFarmListBasedWorkers = workers
  .reduce((acc, cur) => {
    if (acc.cache[`${cur.farmingToken.address}-${cur.baseToken.address}`] || acc.cache[`${cur.baseToken.address}-${cur.farmingToken.address}`]) {
      return acc
    }

    acc.cache[`${cur.farmingToken.address}-${cur.baseToken.address}`] = true
    acc.cache[`${cur.baseToken.address}-${cur.farmingToken.address}`] = true

    acc.result.push(makeFarm(cur.farmingToken, cur.baseToken))

    return acc
    
  }, { cache: {}, result: [] }).result

export const farmPool = makeFarmListBasedWorkers

console.log(farmPool, '@farmPool')

export const farmPoolByWorker = farmPool.reduce((acc, cur) => {

  cur.workerList.forEach((worker) => {
    acc[worker.workerAddress.toLowerCase()] = {
      ...cur,
      ...worker,
    }
    acc[worker.workerAddress] = {
      ...cur,
      ...worker
    }
  })

  return acc
}, {})