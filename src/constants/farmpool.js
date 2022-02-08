import { keyBy } from "lodash"
import { lpTokenByIngredients, tokenList } from "./tokens"
import { workersBy } from "./workers"

const makeFarm = (token1, token2) => {
  return {
    token1,
    token2,
    lpToken: lpTokenByIngredients(token1, token2),
    workerList: workersBy(token1, token2),
    exchange: 'klayswap',
  }
}

export const farmPool = [
  makeFarm(tokenList.KUSDT, tokenList.KDAI),
]

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