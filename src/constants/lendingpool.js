import { keyBy } from "lodash"
import { tokenList } from "./tokens"

// 19%
export const PROTOCOL_FEE = 0.19

// Lending Pool Contract (= Vault Contract) (= ibToken Contract)
export const lendingPools = [
  {
    title: "WEMIX",

    vaultAddress: tokenList["ibWEMIX"].address,
    ibToken: tokenList["ibWEMIX"],

    stakingToken: tokenList["WEMIX"],
    vaultConfigAddress: "0x46E84AD5D7B96840A1b2dCC92d4c699FDc214282",
  },
  {
    title: "KLAY",

    vaultAddress: tokenList["ibKLAY"].address,
    ibToken: tokenList["ibKLAY"],

    stakingToken: tokenList["KLAY"],
    stakingTokenInternal: tokenList["WKLAY"],
    vaultConfigAddress: "0x64246a9D54532Ca36B48625e6f09702Df312A007",
  },
  {
    title: "KUSDT",

    vaultAddress: tokenList["ibKUSDT"].address,
    ibToken: tokenList["ibKUSDT"],

    stakingToken: tokenList["KUSDT"],
    vaultConfigAddress: "0x733D1E208819ECe7E4a0E3B302bc2C70D544689d",
  },
  {
    title: "KDAI",

    vaultAddress: tokenList["ibKDAI"].address,
    ibToken: tokenList["ibKDAI"],

    stakingToken: tokenList["KDAI"],
    vaultConfigAddress: "0xf23f7A02C125d206cA80134A21B0dF767f434FfE",
  },
  {
    title: "KLEVA",

    vaultAddress: tokenList["ibKLEVA"].address,
    ibToken: tokenList["ibKLEVA"],

    stakingToken: tokenList["KLEVA"],
    vaultConfigAddress: "0xacd0927A6D16df8923DcE0D1e8e81291dcBf5BbF",
  },
  {
    title: "KETH",

    vaultAddress: tokenList["ibKETH"].address,
    ibToken: tokenList["ibKETH"],

    stakingToken: tokenList["KETH"],
    vaultConfigAddress: "0xF16223B6DDb092CF25bc3Cf60D47a325F17064B9",
  },
]

export const lendingPoolsByStakingTokenAddress = lendingPools.reduce((acc, cur) => {
  acc[cur.stakingToken.address] = cur
  acc[cur.stakingToken.address.toLowerCase()] = cur
  return acc
}, {})