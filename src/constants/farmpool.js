import { keyBy } from "lodash"
import { tokenList } from "./tokens"
import { workersBy } from "./workers"

export const farmPool = [
  {
    token1: tokenList.KSP,
    token2: tokenList.KUSDT,
    lpToken: tokenList["KSP-KUSDT LP"],
    workerList: workersBy(tokenList.KSP, tokenList.KUSDT),
    // farmingToken: tokenList.KSP,
    // baseToken: tokenList.KUSDT,
    // vaultAddress: tokenList.ibKUSDT.address, // ib${baseToken} address
    // workerAddress: "0xc1B2A0B1fb504EBD7f1c84123Ec3776753AB9e0D",
    exchange: 'klayswap',
    tvl: 1000,
    klevaRewards: 0,
  },
  {
    token1: tokenList.KLEVA,
    token2: tokenList.KUSDT,
    lpToken: tokenList["KLEVA-KUSDT LP"],
    workerList: workersBy(tokenList.KLEVA, tokenList.KUSDT),
    // farmingToken: tokenList.KSP,
    // baseToken: tokenList.KUSDT,
    // vaultAddress: tokenList.ibKUSDT.address, // ib${baseToken} address
    // workerAddress: "0xc1B2A0B1fb504EBD7f1c84123Ec3776753AB9e0D",
    exchange: 'klayswap',
    tvl: 1000,
    klevaRewards: 0,
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