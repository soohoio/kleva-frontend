import { keyBy } from "lodash"
import { tokenList } from "./tokens"

// Lending Pool Contract (= Vault Contract) (= ibToken Contract)
export const lendingPools = [

  {
    title: "KLAY",
    
    vaultAddress: tokenList["ibKLAY"].address,
    ibToken: tokenList["ibKLAY"],

    stakingToken: tokenList["KLAY"],
    stakingTokenInternal: tokenList["WKLAY"],
    vaultConfigAddress: "0x8EcA4309fe4Db57bdF020764951D61de4CD2db15",
  },
  {
    title: "KLEVA",
    
    vaultAddress: tokenList["ibKLEVA"].address,
    ibToken: tokenList["ibKLEVA"],
    
    stakingToken: tokenList["KLEVA"],
    vaultConfigAddress: "0x8EcA4309fe4Db57bdF020764951D61de4CD2db15",
  },
  {
    title: "KUSDT",
    
    vaultAddress: tokenList["ibKUSDT"].address,
    ibToken: tokenList["ibKUSDT"],

    stakingToken: tokenList["KUSDT"],
    vaultConfigAddress: "0x8EcA4309fe4Db57bdF020764951D61de4CD2db15",
  }
]

export const lendingPoolsByStakingTokenAddress = lendingPools.reduce((acc, cur) => {
  acc[cur.stakingToken.address] = cur
  acc[cur.stakingToken.address.toLowerCase()] = cur
  return acc
}, {})