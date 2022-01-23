import { tokenList } from "./tokens"

// REAL
export const workers = [
  {
    farmingToken: tokenList.KUSDT,
    baseToken: tokenList.KLAY,
    vaultAddress: tokenList.ibKLAY.address,
    workerAddress: "0xa0977eA01E3E3D63233699BF8e4C8e517faEF079",
  },
  {
    farmingToken: tokenList.KLAY,
    baseToken: tokenList.KUSDT,
    vaultAddress: tokenList.ibKUSDT.address,
    workerAddress: "0xFfe6a8cEBAD0E9719A9664dbdACF3Bb21ba00aB7",
  },
  {
    farmingToken: tokenList.KSP,
    baseToken: tokenList.KLAY,
    vaultAddress: tokenList.ibKLAY.address,
    workerAddress: "0x4E53E6EC2b8fA873A2a3928e1964C4F36bf333F0",
  },
  {
    farmingToken: tokenList.KETH,
    baseToken: tokenList.KLAY,
    vaultAddress: tokenList.ibKLAY.address,
    workerAddress: "0x0e6E9344E084E3ecEC55F74F7997ddF1dA4b7cD1",
  },
  {
    farmingToken: tokenList.KXRP,
    baseToken: tokenList.KLAY,
    vaultAddress: tokenList.ibKLAY.address,
    workerAddress: "0xb3Bfce4919b621Ce93D62b58d0B383B4eC078E40",
  },
  {
    farmingToken: tokenList.WEMIX,
    baseToken: tokenList.KLAY,
    vaultAddress: tokenList.ibKLAY.address,
    workerAddress: "0x19aFBd63592d981F80B20Ccd4F7Cf8e77a6d5C9E",
  },
  {
    farmingToken: tokenList.KLAY,
    baseToken: tokenList.WEMIX,
    vaultAddress: tokenList.ibWEMIX.address,
    workerAddress: "0x5B47Af9Cebe5DD41877c9181Ff70F7168EA90481",
  },
  {
    farmingToken: tokenList.KUSDC,
    baseToken: tokenList.KUSDT,
    vaultAddress: tokenList.ibKUSDT.address,
    workerAddress: "0xbF7f5e3cDedB751c165Fe15Bb708B9F3d50aBe43",
  },
  {
    farmingToken: tokenList.KDAI,
    baseToken: tokenList.KUSDT,
    vaultAddress: tokenList.ibKUSDT.address,
    workerAddress: "0x77cF6798A90691286dE5F215376e11A1d0ed7e64",
  },
  {
    farmingToken: tokenList.KUSDT,
    baseToken: tokenList.KDAI,
    vaultAddress: tokenList.ibKDAI.address,
    workerAddress: "0xb09d521F8a05a14FBC219bF3d39aC8A706325E90",
  },
  {
    farmingToken: tokenList.KETH,
    baseToken: tokenList.KUSDT,
    vaultAddress: tokenList.ibKUSDT.address,
    workerAddress: "0x7eE2cb1da2F355b5d5F3aE15D69112421f6Be8B8",
  }
]

// TEST
// export const workers = [
//   {
//     "farmingToken": tokenList.KLAY,
//     "baseToken": tokenList.KUSDT,
//     "vaultAddress": tokenList[`ib${tokenList.KUSDT.title}`].address,
//     "workerAddress": "0xbF532C5071B0AF9525833aCC69957645Ea0Adb97",
//   },
//   {
//     "farmingToken": tokenList.KUSDT,
//     "baseToken": tokenList.KLAY,
//     "vaultAddress": tokenList[`ib${tokenList.KLAY.title}`].address,
//     "workerAddress": "0x2A4E18D43d18A65CB7d3Ee3F5a52A6f359bd10c0",
//   },

//   {
//     "farmingToken": tokenList.KSP,
//     "baseToken": tokenList.KLAY,
//     "vaultAddress": tokenList[`ib${tokenList.KLAY.title}`].address,
//     "workerAddress": "0x79152568eccdE7729adEd9AB001Ef9228A181d81",
//   },

//   {
//     "farmingToken": tokenList.KETH,
//     "baseToken": tokenList.KLAY,
//     "vaultAddress": tokenList[`ib${tokenList.KLAY.title}`].address,
//     "workerAddress": "0x5977e7EaE04ce4c6c06034E8221e90e9f1e40037",
//   },

//   {
//     "farmingToken": tokenList.KXRP,
//     "baseToken": tokenList.KLAY,
//     "vaultAddress": tokenList[`ib${tokenList.KLAY.title}`].address,
//     "workerAddress": "0x51F169F9a740f83b3578236986B137B874425557",
//   },

//   {
//     "farmingToken": tokenList.WEMIX,
//     "baseToken": tokenList.KLAY,
//     "vaultAddress": tokenList[`ib${tokenList.KLAY.title}`].address,
//     "workerAddress": "0xf6AA2FFc99987f3e7652E35a9cDABe366aeeEe8d",
//   },

//   {
//     "farmingToken": tokenList.KLEVA,
//     "baseToken": tokenList.KUSDT,
//     "vaultAddress": tokenList[`ib${tokenList.KUSDT.title}`].address,
//     "workerAddress": "0xFCDA8C7D16B921a13fA3a05c1672Ca0ebBe0B81d",
//   },

//   {
//     "farmingToken": tokenList.KUSDT,
//     "baseToken": tokenList.KLEVA,
//     "vaultAddress": tokenList[`ib${tokenList.KLEVA.title}`].address,
//     "workerAddress": "0x3DF65B5891B5aa1C25F4Df15A1CabdC246df3e79",
//   }
// ]




export const workersBy = (token1, token2) => {
  return workers.filter(({ farmingToken, baseToken }) => {
    const isOrderFB = farmingToken.address.toLowerCase() === token1.address.toLowerCase() && baseToken.address.toLowerCase() === token2.address.toLowerCase()
    const isOrderBF = farmingToken.address.toLowerCase() === token2.address.toLowerCase() && baseToken.address.toLowerCase() === token1.address.toLowerCase()

    return isOrderBF || isOrderFB
  })
}