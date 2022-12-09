import { lpTokenByIngredients, tokenList } from "./tokens"

// REAL

export const workers = [
  {
    farmingToken: tokenList.KLAY,
    baseToken: tokenList.WEMIX,
    vaultAddress: tokenList.ibWEMIX.address,
    workerAddress: "0x3B9A6393a0706F9D4325a6dd621Eb8895E2bB84c",
  },
  {
    farmingToken: tokenList.WEMIX,
    baseToken: tokenList.KLAY,
    vaultAddress: tokenList.ibKLAY.address,
    workerAddress: "0xeb751b2E5c679440Fcf96c87dc0EDDf418510329",
  },
  {
    farmingToken: tokenList.WEMIX,
    baseToken: tokenList.oUSDT,
    vaultAddress: tokenList.iboUSDT.address,
    workerAddress: "0xD06BB9160A4286a91E7bE0161254c0896B910452",
  },
  {
    farmingToken: tokenList.oUSDT,
    baseToken: tokenList.WEMIX,
    vaultAddress: tokenList.ibWEMIX.address,
    workerAddress: "0x0bb9b59023F58E6e7F1E692d9f613D9F18ca982A",
  },
  {
    farmingToken: tokenList.KLAY,
    baseToken: tokenList.oUSDT,
    vaultAddress: tokenList.iboUSDT.address,
    workerAddress: "0x76897B986e70Dfd7b9C4bdB04EAd3dc09db7175E",
  },
  {
    farmingToken: tokenList.oUSDT,
    baseToken: tokenList.KLAY,
    vaultAddress: tokenList.ibKLAY.address,
    workerAddress: "0xC857D89e526343f08545F24F1B950A11E930B834",
  },
  {
    farmingToken: tokenList.KSP,
    baseToken: tokenList.KLAY,
    vaultAddress: tokenList.ibKLAY.address,
    workerAddress: "0x79af07a4dFEd325B2187Ff37701c917d2d56c2AC",
  },
  {
    farmingToken: tokenList.oETH,
    baseToken: tokenList.KLAY,
    vaultAddress: tokenList.ibKLAY.address,
    workerAddress: "0xd001fe7c9ce32B51c384CC5503b22fF96745918d",
  },
  {
    farmingToken: tokenList.KLAY,
    baseToken: tokenList.oETH,
    vaultAddress: tokenList.iboETH.address,
    workerAddress: "0x6Bd211B7aEE55417B67e49bAC85F0A066a5aDCfE",
  },
  {
    farmingToken: tokenList.oXRP,
    baseToken: tokenList.KLAY,
    vaultAddress: tokenList.ibKLAY.address,
    workerAddress: "0xA60169244346F83dd7450B031581C8B313E594E8",
  },
  {
    farmingToken: tokenList.KDAI,
    baseToken: tokenList.oUSDT,
    vaultAddress: tokenList.iboUSDT.address,
    workerAddress: "0x6F268a80127Fc89BA72D516615D1581449a0d272",
  },
  {
    farmingToken: tokenList.oUSDT,
    baseToken: tokenList.KDAI,
    vaultAddress: tokenList.ibKDAI.address,
    workerAddress: "0xDd5c98E16695e58fdcC91E9061E188A8699a1a27",
  },
  {
    farmingToken: tokenList.oETH,
    baseToken: tokenList.oUSDT,
    vaultAddress: tokenList.iboUSDT.address,
    workerAddress: "0x24557Cf618342DD645643099Bd74028002a50c3E",
  },
  {
    farmingToken: tokenList.oUSDT,
    baseToken: tokenList.oETH,
    vaultAddress: tokenList.iboETH.address,
    workerAddress: "0x2F1B272D29b565e7f442C42BE868329C06194C7D",
  },
  {
    farmingToken: tokenList.KLEVA,
    baseToken: tokenList.KLAY,
    vaultAddress: tokenList.ibKLAY.address,
    workerAddress: "0xbf72C32B47C46F6B80B8005a58A270e83f389dC6",
  },
  {
    farmingToken: tokenList.KLAY,
    baseToken: tokenList.KLEVA,
    vaultAddress: tokenList.ibKLEVA.address,
    workerAddress: "0xEB7E2399d1e264bCd43A3Dc19441BeFa19524308",
  },
  {
    farmingToken: tokenList.BORA,
    baseToken: tokenList.KLAY,
    vaultAddress: tokenList.ibKLAY.address,
    workerAddress: "0xEf01548a6e23948039a65CE2F709747dED9fD1B0",
  },
  {
    farmingToken: tokenList.oXRP,
    baseToken: tokenList.KDAI,
    vaultAddress: tokenList.ibKDAI.address,
    workerAddress: "0x9339DcADb6F7D40c102E2179253eA2353f718f20",
  },

  {
    farmingToken: tokenList.oUSDC,
    baseToken: tokenList.oUSDT,
    vaultAddress: tokenList.iboUSDT.address,
    workerAddress: "0xb8C31Bfe3F22734CD8b92C6a943F6c7bfABBE6eb",
  },
  {
    farmingToken: tokenList.oUSDT,
    baseToken: tokenList.oUSDC,
    vaultAddress: tokenList.iboUSDC.address,
    workerAddress: "0xaC6b8Aff94aF99607A4538d3069Cbc9e14CCe12B",
  },
  {
    farmingToken: tokenList.KLAY,
    baseToken: tokenList.oUSDC,
    vaultAddress: tokenList.iboUSDC.address,
    workerAddress: "0xd3CD4726C804cB1553Aad028a8C60A8E5c9c8d51",
  },
  {
    farmingToken: tokenList.oUSDC,
    baseToken: tokenList.KLAY,
    vaultAddress: tokenList.ibKLAY.address,
    workerAddress: "0xBBf637ed726797fe0Cd3380C3f8CDF38DB2Cfc24",
  },
]


export const workersBy = (token1, token2) => {
  return workers.filter(({ farmingToken, baseToken }) => {
    const isOrderFB = farmingToken.address.toLowerCase() === token1.address.toLowerCase() && baseToken.address.toLowerCase() === token2.address.toLowerCase()
    const isOrderBF = farmingToken.address.toLowerCase() === token2.address.toLowerCase() && baseToken.address.toLowerCase() === token1.address.toLowerCase()

    return isOrderBF || isOrderFB
  })
}

export const workerByAddress = workers.reduce((acc, cur) => {
  acc[cur.workerAddress] = cur
  return acc
}, {})