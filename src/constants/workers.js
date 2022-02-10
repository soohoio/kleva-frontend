import { tokenList } from "./tokens"

// REAL
export const workers = [
  {
    farmingToken: tokenList.KDAI,
    baseToken: tokenList.KUSDT,
    vaultAddress: tokenList.ibKUSDT.address,
    workerAddress: "0x3A638E5cb20a72Dd5c76b33A165E622d608Dd1e3",
  }
]

export const workersBy = (token1, token2) => {
  return workers.filter(({ farmingToken, baseToken }) => {
    console.log(farmingToken, 'farmingToken')
    console.log(token1, 'token1')
    console.log(token2, 'token2')
    const isOrderFB = farmingToken.address.toLowerCase() === token1.address.toLowerCase() && baseToken.address.toLowerCase() === token2.address.toLowerCase()
    const isOrderBF = farmingToken.address.toLowerCase() === token2.address.toLowerCase() && baseToken.address.toLowerCase() === token1.address.toLowerCase()

    return isOrderBF || isOrderFB
  })
}