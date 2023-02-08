import { lpTokenByIngredients } from "./tokens"
import { workers, workersBy } from "./workers"
import { lendingPoolsByStakingTokenAddress } from './lendingpool';

const makeFarm = (tokens) => {

  const workerList = workersBy(tokens)

  const defaultBorrowingAsset = tokens.filter(({ address, borrowingDisabled }) => {
    const hasLendingPool = !!lendingPoolsByStakingTokenAddress[address.toLowerCase()]
    // return !borrowingDisabled && hasLendingPool
    return hasLendingPool
  })[0]

  const tokensMap = tokens.reduce((acc, cur, idx) => {
    acc[`token${idx + 1}`] = cur
    return acc
  }, {})

  console.log(workerList, 'workerList')

  return {
    ...tokensMap,
    lpToken: lpTokenByIngredients(tokens),
    workerList: workerList,
    defaultBorrowingAsset,
    exchange: workerList[0].exchange,
  }
}

const makeFarmListBasedWorkers = workers
  .reduce((acc, cur) => {

    if (acc.cache[cur.farmKey]) return acc

    acc.cache[cur.farmKey] = true

    acc.result.push(
      makeFarm(
        cur.tokens || [cur.farmingToken, cur.baseToken]
      )
    )

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