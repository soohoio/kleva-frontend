import { tokenList } from "./tokens"

export const stakingPools = [
  {
    title: "ibWEMIX",
    vaultAddress: tokenList.ibWEMIX.address,
    pid: 4,
    stakingToken: tokenList.ibWEMIX,
  },
  {
    title: "ibKLAY",
    vaultAddress: tokenList.ibKLAY.address,
    pid: 0,
    stakingToken: tokenList.ibKLAY,
    stakingTokenInternal: tokenList.WKLAY,
  },
  {
    title: "ibKUSDT",
    vaultAddress: tokenList.ibKUSDT.address,
    pid: 2,
    stakingToken: tokenList.ibKUSDT,
  },
  {
    title: "ibKDAI",
    vaultAddress: tokenList.ibKDAI.address,
    pid: 6,
    stakingToken: tokenList.ibKDAI,
  },
  {
    title: "ibKLEVA",
    vaultAddress: tokenList.ibKLEVA.address,
    pid: 8,
    stakingToken: tokenList.ibKLEVA,
  },
]

export const stakingPoolsByToken = stakingPools.reduce((acc, cur) => {
  acc[cur.stakingToken.address] = cur
  acc[cur.stakingToken.address.toLowerCase()] = cur
  return acc
}, {})

export const stakingPoolsByPID = stakingPools.reduce((acc, cur) => {
  acc[cur.pid] = cur
  return acc
}, {})