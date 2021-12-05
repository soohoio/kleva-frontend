import { tokenList } from "./tokens"

export const stakingPools = [
  {
    title: "ibKLAY",
    vaultAddress: tokenList.ibKLAY.address,
    pid: 0,
    stakingToken: tokenList.ibKLAY,
    stakingTokenInternal: tokenList.WKLAY,
  },
  {
    title: "ibKLEVA",
    vaultAddress: tokenList.ibKLEVA.address,
    pid: 1,
    stakingToken: tokenList.ibKLEVA,
  },
  {
    title: "ibKUSDT",
    vaultAddress: tokenList.ibKUSDT.address,
    pid: 2,
    stakingToken: tokenList.ibKUSDT,
  }
]