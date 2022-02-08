import { tokenList } from "./tokens"

export const stakingPools = [
  {
    title: "ibKUSDT",
    vaultAddress: tokenList.ibKUSDT.address,
    pid: 0,
    stakingToken: tokenList.ibKUSDT,
  }
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