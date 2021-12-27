import { tokenList } from "./tokens"

export const workers = [
  {
    "farmingToken": tokenList.KLAY,
    "baseToken": tokenList.KUSDT,
    "vaultAddress": tokenList[`ib${tokenList.KUSDT.title}`].address,
    "workerAddress": "0xbF532C5071B0AF9525833aCC69957645Ea0Adb97",
  },
  {
    "farmingToken": tokenList.KUSDT,
    "baseToken": tokenList.KLAY,
    "vaultAddress": tokenList[`ib${tokenList.KLAY.title}`].address,
    "workerAddress": "0x2A4E18D43d18A65CB7d3Ee3F5a52A6f359bd10c0",
  },

  {
    "farmingToken": tokenList.KSP,
    "baseToken": tokenList.KLAY,
    "vaultAddress": tokenList[`ib${tokenList.KLAY.title}`].address,
    "workerAddress": "0x79152568eccdE7729adEd9AB001Ef9228A181d81",
  },

  {
    "farmingToken": tokenList.KETH,
    "baseToken": tokenList.KLAY,
    "vaultAddress": tokenList[`ib${tokenList.KLAY.title}`].address,
    "workerAddress": "0x5977e7EaE04ce4c6c06034E8221e90e9f1e40037",
  },

  {
    "farmingToken": tokenList.KXRP,
    "baseToken": tokenList.KLAY,
    "vaultAddress": tokenList[`ib${tokenList.KLAY.title}`].address,
    "workerAddress": "0x51F169F9a740f83b3578236986B137B874425557",
  },

  {
    "farmingToken": tokenList.WEMIX,
    "baseToken": tokenList.KLAY,
    "vaultAddress": tokenList[`ib${tokenList.KLAY.title}`].address,
    "workerAddress": "0xf6AA2FFc99987f3e7652E35a9cDABe366aeeEe8d",
  },

  {
    "farmingToken": tokenList.KLEVA,
    "baseToken": tokenList.KUSDT,
    "vaultAddress": tokenList[`ib${tokenList.KUSDT.title}`].address,
    "workerAddress": "0xFCDA8C7D16B921a13fA3a05c1672Ca0ebBe0B81d",
  },

  {
    "farmingToken": tokenList.KUSDT,
    "baseToken": tokenList.KLEVA,
    "vaultAddress": tokenList[`ib${tokenList.KLEVA.title}`].address,
    "workerAddress": "0x3DF65B5891B5aa1C25F4Df15A1CabdC246df3e79",
  }
]




export const workersBy = (token1, token2) => {
  return workers.filter(({ farmingToken, baseToken }) => {
    const isOrderFB = farmingToken.address.toLowerCase() === token1.address.toLowerCase() && baseToken.address.toLowerCase() === token2.address.toLowerCase()
    const isOrderBF = farmingToken.address.toLowerCase() === token2.address.toLowerCase() && baseToken.address.toLowerCase() === token1.address.toLowerCase()

    return isOrderBF || isOrderFB
  })
}