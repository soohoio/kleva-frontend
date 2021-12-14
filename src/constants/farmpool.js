import { keyBy } from "lodash"
import { tokenList } from "./tokens"
import { workersBy } from "./workers"

export const farmPool = [
  {
    token1: tokenList.KSP,
    token2: tokenList.KUSDT,
    lpToken: tokenList["KSP-KUSDT LP"],
    workerList: workersBy(tokenList.KSP, tokenList.KUSDT),
    
    exchange: 'klayswap',
  },
  {
    token1: tokenList.KLEVA,
    token2: tokenList.KUSDT,
    lpToken: tokenList["KLEVA-KUSDT LP"],
    workerList: workersBy(tokenList.KLEVA, tokenList.KUSDT),
    exchange: 'klayswap',
  },
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