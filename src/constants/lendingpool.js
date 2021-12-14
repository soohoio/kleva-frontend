import { keyBy } from "lodash"
import { tokenList } from "./tokens"

// 19%
export const PROTOCOL_FEE = 0.19

// Lending Pool Contract (= Vault Contract) (= ibToken Contract)
export const lendingPools = [

  {
    title: "KLAY",
    
    vaultAddress: tokenList["ibKLAY"].address,
    ibToken: tokenList["ibKLAY"],

    stakingToken: tokenList["KLAY"],
    stakingTokenInternal: tokenList["WKLAY"],
    vaultConfigAddress: "0x6807A813675877bbFAb18CfDEbd76452EA11f6DB",
  },
  {
    title: "KLEVA",
    
    vaultAddress: tokenList["ibKLEVA"].address,
    ibToken: tokenList["ibKLEVA"],
    
    stakingToken: tokenList["KLEVA"],
    vaultConfigAddress: "0x6807A813675877bbFAb18CfDEbd76452EA11f6DB",
  },
  {
    title: "KUSDT",
    
    vaultAddress: tokenList["ibKUSDT"].address,
    ibToken: tokenList["ibKUSDT"],

    stakingToken: tokenList["KUSDT"],
    vaultConfigAddress: "0x6807A813675877bbFAb18CfDEbd76452EA11f6DB",
  }
]

export const lendingPoolsByStakingTokenAddress = lendingPools.reduce((acc, cur) => {
  acc[cur.stakingToken.address] = cur
  acc[cur.stakingToken.address.toLowerCase()] = cur
  return acc
}, {})