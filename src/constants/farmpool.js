import { keyBy } from "lodash"
import { tokenList } from "./tokens"
import { workersBy } from "./workers"

export const farmPool = [
  {
    token1: tokenList.KLAY,
    token2: tokenList.KUSDT,
    lpToken: tokenList["KLAY-KUSDT LP"],
    workerList: workersBy(tokenList.KLAY, tokenList.KUSDT),
    exchange: 'klayswap',
  },
  {
    token1: tokenList.KLAY,
    token2: tokenList.KSP,
    lpToken: tokenList["KLAY-KSP LP"],
    workerList: workersBy(tokenList.KSP, tokenList.KLAY),
    exchange: 'klayswap',
  },
  {
    token1: tokenList.KLAY,
    token2: tokenList.KETH,
    lpToken: tokenList["KLAY-KETH LP"],
    workerList: workersBy(tokenList.KLAY, tokenList.KETH),
    exchange: 'klayswap',
  },
  {
    token1: tokenList.KLAY,
    token2: tokenList.KXRP,
    lpToken: tokenList["KLAY-KXRP LP"],
    workerList: workersBy(tokenList.KLAY, tokenList.KXRP),
    exchange: 'klayswap',
  },
  {
    token1: tokenList.KLAY,
    token2: tokenList.WEMIX,
    lpToken: tokenList["KLAY-WEMIX LP"],
    workerList: workersBy(tokenList.KLAY, tokenList.WEMIX),
    exchange: 'klayswap',
  },
  {
    token1: tokenList.KUSDT,
    token2: tokenList.KLEVA,
    lpToken: tokenList["KLEVA-KUSDT LP"],
    workerList: workersBy(tokenList.KUSDT, tokenList.KLEVA),
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