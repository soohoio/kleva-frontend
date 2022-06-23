import { lpTokenByIngredients } from "./tokens"
import { workers, workersBy } from "./workers"

const makeFarm = (token1, token2) => {

  return {
    token1,
    token2,
    lpToken: lpTokenByIngredients(token1, token2),
    workerList: workersBy(token1, token2),
    exchange: 'klayswap',
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