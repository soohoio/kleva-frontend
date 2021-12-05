import { tokenList } from "./tokens"

export const workers = [
  {
    workerAddress: "0x66B87149AaFd8878b59175FEAe0C1A45A64EABa5",
    vaultAddress: tokenList.ibKUSDT.address,
    farmingToken: tokenList.KSP,
    baseToken: tokenList.KUSDT,
  }
]

export const workersBy = (token1, token2) => {
  return workers.filter(({ farmingToken, baseToken }) => {
    const isOrderFB = farmingToken.address.toLowerCase() === token1.address.toLowerCase() && baseToken.address.toLowerCase() === token2.address.toLowerCase()
    const isOrderBF = farmingToken.address.toLowerCase() === token2.address.toLowerCase() && baseToken.address.toLowerCase() === token1.address.toLowerCase()

    return isOrderBF || isOrderFB
  })
}