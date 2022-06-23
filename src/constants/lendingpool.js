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
    vaultConfigAddress: "0x9a5Db51B43732bceE2a05B196f93C3d512E132CD",
  },
  {
    title: "KLAY",
    
    vaultAddress: tokenList["ibKLAY"].address,
    ibToken: tokenList["ibKLAY"],
    
    stakingToken: tokenList["KLAY"],
    stakingTokenInternal: tokenList["WKLAY"],
    vaultConfigAddress: "0xa27A73223A3f99b25D5366eCDFbc961728f82801",
  },
  {
    title: "oUSDT",
    
    vaultAddress: tokenList["iboUSDT"].address,
    ibToken: tokenList["iboUSDT"],
    
    stakingToken: tokenList["oUSDT"],
    vaultConfigAddress: "0x24Ae164a3D5E80f8584b412312131EC027b606A9",
  },
  {
    title: "KDAI",

    vaultAddress: tokenList["ibKDAI"].address,
    ibToken: tokenList["ibKDAI"],

    stakingToken: tokenList["KDAI"],
    vaultConfigAddress: "0x5B841b4Af1c83EFda90c1804924aeAF7464D52CF",
  },
  {
    title: "oETH",

    vaultAddress: tokenList["iboETH"].address,
    ibToken: tokenList["iboETH"],

    stakingToken: tokenList["oETH"],
    vaultConfigAddress: "0x0Ff993E794a536f34E6e8db19e6124f66EC4AF67",
  },
  {
    title: "oUSDC",

    vaultAddress: tokenList["iboUSDC"].address,
    ibToken: tokenList["iboUSDC"],

    stakingToken: tokenList["oUSDC"],
    vaultConfigAddress: "0x4AE464E0E659Ece13e9Ba1445C61F38cCC60b62d",
  },
  {
    title: "KLEVA",

    vaultAddress: tokenList["ibKLEVA"].address,
    ibToken: tokenList["ibKLEVA"],

    stakingToken: tokenList["KLEVA"],
    vaultConfigAddress: "0xa38D0a564A953B010dE32a4105FD9c34CeF55306",
  },
]

export const lendingPoolsByStakingTokenAddress = lendingPools.reduce((acc, cur) => {
  acc[cur.stakingToken.address] = cur
  acc[cur.stakingToken.address.toLowerCase()] = cur
  return acc
}, {})