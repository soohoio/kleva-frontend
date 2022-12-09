import { isEqual, sortBy } from "lodash"
import { lpTokenByIngredients, sortTokenKey, tokenList } from "./tokens"

// REAL
export const workers = [
  {
    farmingToken: tokenList.KLAY,
    baseToken: tokenList.WEMIX,
    vaultAddress: tokenList.ibWEMIX.address,
    workerAddress: "0x3B9A6393a0706F9D4325a6dd621Eb8895E2bB84c",
    exchange: 'klayswap',
  },
  {
    farmingToken: tokenList.WEMIX,
    baseToken: tokenList.KLAY,
    vaultAddress: tokenList.ibKLAY.address,
    workerAddress: "0xeb751b2E5c679440Fcf96c87dc0EDDf418510329",
    exchange: 'klayswap',
  },
  {
    farmingToken: tokenList.WEMIX,
    baseToken: tokenList.oUSDT,
    vaultAddress: tokenList.iboUSDT.address,
    workerAddress: "0xD06BB9160A4286a91E7bE0161254c0896B910452",
    exchange: 'klayswap',
  },
  {
    farmingToken: tokenList.oUSDT,
    baseToken: tokenList.WEMIX,
    vaultAddress: tokenList.ibWEMIX.address,
    workerAddress: "0x0bb9b59023F58E6e7F1E692d9f613D9F18ca982A",
    exchange: 'klayswap',
  },
  {
    farmingToken: tokenList.KLAY,
    baseToken: tokenList.oUSDT,
    vaultAddress: tokenList.iboUSDT.address,
    workerAddress: "0x76897B986e70Dfd7b9C4bdB04EAd3dc09db7175E",
    exchange: 'klayswap',
  },
  {
    farmingToken: tokenList.oUSDT,
    baseToken: tokenList.KLAY,
    vaultAddress: tokenList.ibKLAY.address,
    workerAddress: "0xC857D89e526343f08545F24F1B950A11E930B834",
    exchange: 'klayswap',
  },
  {
    farmingToken: tokenList.KSP,
    baseToken: tokenList.KLAY,
    vaultAddress: tokenList.ibKLAY.address,
    workerAddress: "0x79af07a4dFEd325B2187Ff37701c917d2d56c2AC",
    exchange: 'klayswap',
  },
  {
    farmingToken: tokenList.oETH,
    baseToken: tokenList.KLAY,
    vaultAddress: tokenList.ibKLAY.address,
    workerAddress: "0xd001fe7c9ce32B51c384CC5503b22fF96745918d",
    exchange: 'klayswap',
  },
  {
    farmingToken: tokenList.KLAY,
    baseToken: tokenList.oETH,
    vaultAddress: tokenList.iboETH.address,
    workerAddress: "0x6Bd211B7aEE55417B67e49bAC85F0A066a5aDCfE",
    exchange: 'klayswap',
  },
  {
    farmingToken: tokenList.oXRP,
    baseToken: tokenList.KLAY,
    vaultAddress: tokenList.ibKLAY.address,
    workerAddress: "0xA60169244346F83dd7450B031581C8B313E594E8",
    exchange: 'klayswap',
  },
  {
    farmingToken: tokenList.KDAI,
    baseToken: tokenList.oUSDT,
    vaultAddress: tokenList.iboUSDT.address,
    workerAddress: "0x6F268a80127Fc89BA72D516615D1581449a0d272",
    exchange: 'klayswap',
  },
  {
    farmingToken: tokenList.oUSDT,
    baseToken: tokenList.KDAI,
    vaultAddress: tokenList.ibKDAI.address,
    workerAddress: "0xDd5c98E16695e58fdcC91E9061E188A8699a1a27",
    exchange: 'klayswap',
  },
  {
    farmingToken: tokenList.oETH,
    baseToken: tokenList.oUSDT,
    vaultAddress: tokenList.iboUSDT.address,
    workerAddress: "0x24557Cf618342DD645643099Bd74028002a50c3E",
    exchange: 'klayswap',
  },
  {
    farmingToken: tokenList.oUSDT,
    baseToken: tokenList.oETH,
    vaultAddress: tokenList.iboETH.address,
    workerAddress: "0x2F1B272D29b565e7f442C42BE868329C06194C7D",
    exchange: 'klayswap',
  },
  {
    farmingToken: tokenList.KLEVA,
    baseToken: tokenList.KLAY,
    vaultAddress: tokenList.ibKLAY.address,
    workerAddress: "0xbf72C32B47C46F6B80B8005a58A270e83f389dC6",
    exchange: 'klayswap',
  },
  {
    farmingToken: tokenList.KLAY,
    baseToken: tokenList.KLEVA,
    vaultAddress: tokenList.ibKLEVA.address,
    workerAddress: "0xEB7E2399d1e264bCd43A3Dc19441BeFa19524308",
    exchange: 'klayswap',
  },
  {
    farmingToken: tokenList.BORA,
    baseToken: tokenList.KLAY,
    vaultAddress: tokenList.ibKLAY.address,
    workerAddress: "0xEf01548a6e23948039a65CE2F709747dED9fD1B0",
    exchange: 'klayswap',
  },
  {
    farmingToken: tokenList.oXRP,
    baseToken: tokenList.KDAI,
    vaultAddress: tokenList.ibKDAI.address,
    workerAddress: "0x9339DcADb6F7D40c102E2179253eA2353f718f20",
    exchange: 'klayswap',
  },

  {
    farmingToken: tokenList.oUSDC,
    baseToken: tokenList.oUSDT,
    vaultAddress: tokenList.iboUSDT.address,
    workerAddress: "0xb8C31Bfe3F22734CD8b92C6a943F6c7bfABBE6eb",
    exchange: 'klayswap',
  },
  {
    farmingToken: tokenList.oUSDT,
    baseToken: tokenList.oUSDC,
    vaultAddress: tokenList.iboUSDC.address,
    workerAddress: "0xaC6b8Aff94aF99607A4538d3069Cbc9e14CCe12B",
    exchange: 'klayswap',
  },
  {
    farmingToken: tokenList.KLAY,
    baseToken: tokenList.oUSDC,
    vaultAddress: tokenList.iboUSDC.address,
    workerAddress: "0xd3CD4726C804cB1553Aad028a8C60A8E5c9c8d51",
    exchange: 'klayswap',
  },
  {
    farmingToken: tokenList.oUSDC,
    baseToken: tokenList.KLAY,
    vaultAddress: tokenList.ibKLAY.address,
    workerAddress: "0xBBf637ed726797fe0Cd3380C3f8CDF38DB2Cfc24",
    exchange: 'klayswap',
  },

  // Kokonutswap base pool
  {
    farmingTokens: [
      tokenList.KSD,
      tokenList.oUSDT,
      tokenList.oUSDC,
    ],
    baseToken: tokenList.KDAI,
    vaultAddress: tokenList.ibKDAI.address,
    workerAddress: "0x2d710dCc3AB075154287d39305456fE2FCF4FF91",
    exchange: 'kokonutswap',
  },
  {
    farmingTokens: [
      tokenList.KSD,
      tokenList.KDAI,
      tokenList.oUSDC,
    ],
    baseToken: tokenList.oUSDT,
    vaultAddress: tokenList.iboUSDT.address,
    workerAddress: "0xCA866c7EFF996D529DCFB2BD7863ea2d6ab217f9",
    exchange: 'kokonutswap',
  },
  {
    farmingTokens: [
      tokenList.KSD,
      tokenList.KDAI,
      tokenList.oUSDT,
    ],
    baseToken: tokenList.oUSDC,
    vaultAddress: tokenList.iboUSDC.address,
    workerAddress: "0xD3db345A452a685A84414313E07e3745C092a7a9",
    exchange: 'kokonutswap',
  },
  // Kokonutswap crypto pool
  {
    farmingToken: tokenList.KSD,
    baseToken: tokenList.KLAY,
    vaultAddress: tokenList.ibKLAY.address,
    workerAddress: "0x780D93666bC7b36e52c280BAc6B92FB73113eBA8",
    exchange: 'kokonutswap',
  },
].map((item) => {
  const arr = [item.farmingToken, item.baseToken, ...(item.farmingTokens || [])].filter(a => !!a)
  
  const farmKey = sortTokenKey(arr)  
  return { ...item, farmKey }
})

export const workersBy = (tokens) => {
  const sortedTokenKey = sortTokenKey(tokens)

  return workers.filter(({ farmingToken, baseToken, farmingTokens = [] }) => {

    return isEqual(
      sortedTokenKey,
      sortTokenKey([farmingToken, baseToken, ...farmingTokens].filter((a) => !!a))
    )
  })
}

export const workerByAddress = workers.reduce((acc, cur) => {
  acc[cur.workerAddress] = cur
  return acc
}, {})