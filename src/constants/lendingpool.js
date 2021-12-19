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
    vaultConfigAddress: "0x27fd51dab61c9f979A463d7b1F4f1F17648974bE",
  },
  {
    title: "KLEVA",
    
    vaultAddress: tokenList["ibKLEVA"].address,
    ibToken: tokenList["ibKLEVA"],
    
    stakingToken: tokenList["KLEVA"],
    vaultConfigAddress: "0x27fd51dab61c9f979A463d7b1F4f1F17648974bE",
  },
  {
    title: "KUSDT",
    
    vaultAddress: tokenList["ibKUSDT"].address,
    ibToken: tokenList["ibKUSDT"],

    stakingToken: tokenList["KUSDT"],
    vaultConfigAddress: "0x27fd51dab61c9f979A463d7b1F4f1F17648974bE",
  },
  {
    title: "WEMIX",
    
    vaultAddress: tokenList["ibWEMIX"].address,
    ibToken: tokenList["ibWEMIX"],

    stakingToken: tokenList["WEMIX"],
    vaultConfigAddress: "0x27fd51dab61c9f979A463d7b1F4f1F17648974bE",
  },
  {
    title: "KDAI",
    
    vaultAddress: tokenList["ibKDAI"].address,
    ibToken: tokenList["ibKDAI"],

    stakingToken: tokenList["KDAI"],
    vaultConfigAddress: "0x27fd51dab61c9f979A463d7b1F4f1F17648974bE",
  },
]

export const lendingPoolsByStakingTokenAddress = lendingPools.reduce((acc, cur) => {
  acc[cur.stakingToken.address] = cur
  acc[cur.stakingToken.address.toLowerCase()] = cur
  return acc
}, {})