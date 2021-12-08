import { tokenList } from "./tokens"

export const workers = [
  {
    workerAddress: "0x7aCde72A4D964D168f56CF32Ba3F098038cb77D1",
    vaultAddress: tokenList.ibKUSDT.address,
    farmingToken: tokenList.KSP,
    baseToken: tokenList.KUSDT,
  },
  {
    workerAddress: "0x2E3d62Fb0B9f5EdD07ef681Ea6b8a9382818288c",
    vaultAddress: tokenList.ibKUSDT.address,
    farmingToken: tokenList.KLEVA,
    baseToken: tokenList.KUSDT,
  },
  {
    workerAddress: "0xEBF0C1d317EE45633A6E08c20b756304A08Daf88",
    vaultAddress: tokenList.ibKLEVA.address,
    farmingToken: tokenList.KUSDT,
    baseToken: tokenList.KLEVA,
  },
]

export const workersBy = (token1, token2) => {
  return workers.filter(({ farmingToken, baseToken }) => {
    const isOrderFB = farmingToken.address.toLowerCase() === token1.address.toLowerCase() && baseToken.address.toLowerCase() === token2.address.toLowerCase()
    const isOrderBF = farmingToken.address.toLowerCase() === token2.address.toLowerCase() && baseToken.address.toLowerCase() === token1.address.toLowerCase()

    console.log(farmingToken, 'farmingToken')
    console.log(baseToken, 'baseToken')
    console.log(token1, 'token1')
    console.log(token2, 'token2')
    console.log(isOrderBF, 'isOrderBF')
    console.log(isOrderFB, 'isOrderFB')

    return isOrderBF || isOrderFB
  })
}

console.log(workersBy(tokenList.KLEVA, tokenList.KUSDT), "WORKER!")