import BigNumber from 'bignumber.js'
import { isSameAddress } from '../utils/misc'

export const singleTokens = {
  "KLAY": {
    title: "KLAY",
    address: "0x0000000000000000000000000000000000000000",
    iconSrc: "/static/images/tokens/token-KLAY.svg?date=20220929",
    decimals: 18,
    nativeCoin: true,
  },
  "WKLAY": {
    title: "WKLAY",
    address: "0xF6F6b8Bd0aC500639148f8ca5a590341A97De0DE",
    iconSrc: "/static/images/tokens/token-KLAY.svg?date=20220929",
    decimals: 18,
  },
  "KLEVA": {
    title: "KLEVA",
    address: "0x5fFF3a6C16C2208103F318F4713D4D90601A7313",
    iconSrc: "/static/images/tokens/token-KLEVA.svg?date=20220929",
    decimals: 18,
  },
  "oUSDT": {
    title: "oUSDT",
    address: "0xcee8faf64bb97a73bb51e115aa89c17ffa8dd167",
    iconSrc: "/static/images/tokens/token-KUSDT.svg?date=20220929",
    decimals: 6,
  },
  "KSP": {
    title: "KSP",
    address: "0xc6a2ad8cc6e4a7e08fc37cc5954be07d499e7654",
    iconSrc: "/static/images/tokens/token-KSP.svg?date=20220929",
    decimals: 18,
  }, 
  "WEMIX": {
    title: "WEMIX",
    address: "0x5096db80b21ef45230c9e423c373f1fc9c0198dd",
    iconSrc: "/static/images/tokens/token-WEMIX.svg?date=20220929",
    decimals: 18,
  }, 
  "KDAI": {
    title: "KDAI",
    address: "0x5c74070fdea071359b86082bd9f9b3deaafbe32b",
    iconSrc: "/static/images/tokens/token-KDAI.svg?date=20220929",
    decimals: 18,
  }, 
  "oUSDC": {
    title: "oUSDC",
    address: "0x754288077d0ff82af7a5317c7cb8c444d421d103",
    iconSrc: "/static/images/tokens/token-KUSDC.svg?date=20220929",
    decimals: 6,
  }, 
  "oETH": {
    title: "oETH",
    address: "0x34d21b1e550d73cee41151c77f3c73359527a396",
    iconSrc: "/static/images/tokens/token-KETH.svg?date=20220929",
    decimals: 18,
  }, 
  "oXRP": {
    title: "oXRP",
    address: "0x9eaefb09fe4aabfbe6b1ca316a3c36afc83a393f",
    iconSrc: "/static/images/tokens/token-KXRP.svg?date=20220929",
    decimals: 6,
  }, 
  "BORA": {
    title: "BORA",
    address: "0x02cbe46fb8a1f579254a9b485788f2d86cad51aa",
    iconSrc: "/static/images/tokens/token-BORA.svg?date=20220929",
    decimals: 18,
  },
}

export const lpTokens = {
  // Token A - Token B

  "KLAY-oUSDT LP": {
    KSLP: true,
    ingredients: [singleTokens.KLAY, singleTokens.oUSDT],
    title: "KLAY-oUSDT LP",
    address: "0xd83f1b074d81869eff2c46c530d7308ffec18036",
    decimals: 18,
  },

  "KLAY-KSP LP": {
    KSLP: true,
    ingredients: [singleTokens.KLAY, singleTokens.KSP],
    title: "KLAY-KSP LP",
    address: "0x34cF46c21539e03dEb26E4FA406618650766f3b9",
    decimals: 18,
  },

  "KLAY-oETH LP": {
    KSLP: true,
    ingredients: [singleTokens.KLAY, singleTokens.oETH],
    title: "KLAY-oETH LP",
    address: "0x27f80731dddb90c51cd934e9bd54bff2d4e99e8a",
    decimals: 18,
  },

  "KLAY-oXRP LP": {
    KSLP: true,
    ingredients: [singleTokens.KLAY, singleTokens.oXRP],
    title: "KLAY-oXRP LP",
    address: "0x86e614ef51b305c36a0608baa57fcaaa45844d87",
    decimals: 18,
  },

  "KLAY-WEMIX LP": {
    KSLP: true,
    ingredients: [singleTokens.KLAY, singleTokens.WEMIX],
    title: "KLAY-WEMIX LP",
    address: "0x917EeD7ae9E7D3b0D875dd393Af93fFf3Fc301F8",
    decimals: 18,
  },

  "oUSDT-oUSDC LP": {
    KSLP: true,
    ingredients: [singleTokens.oUSDT, singleTokens.oUSDC],
    title: "oUSDT-oUSDC LP",
    address: "0x2e9269b718cc816de6a9e3c27e5bdb0f6a01b0ac",
    decimals: 6,
  },
  
  "oUSDT-KDAI LP": {
    KSLP: true,
    ingredients: [singleTokens.oUSDT, singleTokens.KDAI],
    title: "oUSDT-KDAI LP",
    address: "0xc320066b25b731a11767834839fe57f9b2186f84",
    decimals: 6,
  },
  
  "oETH-oUSDT LP": {
    KSLP: true,
    ingredients: [singleTokens.oETH, singleTokens.oUSDT],
    title: "oETH-oUSDT LP",
    address: "0x029e2a1b2bb91b66bd25027e1c211e5628dbcb93",
    decimals: 18,
  },

  "oUSDT-WEMIX LP": {
    KSLP: true,
    ingredients: [singleTokens.oUSDT, singleTokens.WEMIX],
    title: "oUSDT-WEMIX LP",
    address: "0x2D803838Cb2D40EaCB0207ec4E567e2a8886b47F",
    decimals: 18,
  },
  "KLAY-BORA LP": {
    KSLP: true,
    ingredients: [singleTokens.KLAY, singleTokens.BORA],
    title: "KLAY-BORA LP",
    address: "0xbbcA9B2D17987aCE3E98E376931c540270CE71bB",
    decimals: 18,
  },

  "oETH-oXRP LP": {
    KSLP: true,
    ingredients: [singleTokens.oETH, singleTokens.oXRP],
    title: "oETH-oXRP LP",
    address: "0x85ef87815bd7be28bee038ff201db78c7e0ed2b9",
    decimals: 18,
  },

  "oXRP-KDAI LP": {
    KSLP: true,
    ingredients: [singleTokens.oXRP, singleTokens.KDAI],
    title: "oXRP-KDAI LP",
    address: "0x4B50d0e4F29bF5B39a6234B11753fDB3b28E76Fc",
    decimals: 6,
  },

  "KLAY-KLEVA LP": {
    KSLP: true,
    ingredients: [singleTokens.KLAY, singleTokens.KLEVA],
    title: "KLAY-KLEVA LP",
    address: "0xd5eb5732ef45b82edaee421cbfb3e412b54d1d2f",
    decimals: 18,
  },
  
  "oUSDT-oUSDC LP": {
    KSLP: true,
    ingredients: [singleTokens.oUSDT, singleTokens.oUSDC],
    title: "oUSDT-oUSDC LP",
    address: "0x2e9269b718cc816de6a9e3c27e5bdb0f6a01b0ac",
    decimals: 6,
  },
  
  "KLAY-oUSDC LP": {
    KSLP: true,
    ingredients: [singleTokens.KLAY, singleTokens.oUSDC],
    title: "KLAY-oUSDC LP",
    address: "0x3bce8d81ac54010bb7ea6e5960f2ded6fc6a7ac5",
    decimals: 18,
  },
}

export const ibTokens = {
  "ibKLAY": {
    title: "ibKLAY",
    address: "0xa691c5891D8a98109663d07Bcf3ED8d3edef820A",
    iconSrc: "/static/images/tokens/token-KLAY.svg?date=20220929",
    decimals: singleTokens["WKLAY"].decimals,
    minDebtSize: new BigNumber(50 * 10 ** 18).toString(),

    originalToken: singleTokens.KLAY,
  },
  "iboUSDT": {
    title: "iboUSDT",
    address: "0xfAeeC9B2623b66BBB3545cA24cFc32A8504fcF1B",
    iconSrc: "/static/images/tokens/token-KUSDT.svg?date=20220929",
    decimals: singleTokens["oUSDT"].decimals,
    minDebtSize: new BigNumber(100 * 10 ** 6).toString(),

    originalToken: singleTokens.oUSDT,
  },
  "ibWEMIX": {
    title: "ibWEMIX",
    address: "0xD429914222b7474Ea2C288Ec581D303599EeD137",
    iconSrc: "/static/images/tokens/token-WEMIX.svg?date=20220929",
    decimals: singleTokens["WEMIX"].decimals,
    minDebtSize: new BigNumber(10 * 10 ** 18).toString(),

    originalToken: singleTokens.WEMIX,
  },
  "ibKDAI": {
    title: "ibKDAI",
    address: "0x58770d59238B99Bd75c4298E33c6493eC4F17E2C",
    iconSrc: "/static/images/tokens/token-KDAI.svg?date=20220929",
    decimals: singleTokens["KDAI"].decimals,
    minDebtSize: new BigNumber(100 * 10 ** 18).toString(),

    originalToken: singleTokens.KDAI,
  },
  "ibKLEVA": {
    title: "ibKLEVA",
    address: "0x7fFc4146B43cD099928a813b2c219Af2e49611E0",
    iconSrc: "/static/images/tokens/token-KLEVA.svg?date=20220929",
    decimals: singleTokens["KLEVA"].decimals,
    minDebtSize: new BigNumber(50 * 10 ** 18).toString(),

    originalToken: singleTokens.KLEVA,
  },
  "iboETH": {
    title: "iboETH",
    address: "0x87438944076b1A32E28a2572454437563CaA7470",
    iconSrc: "/static/images/tokens/token-KETH.svg?date=20220929",
    decimals: singleTokens["oETH"].decimals,
    minDebtSize: new BigNumber(0.04 * 10 ** 18).toString(),

    originalToken: singleTokens.oETH,
  },
  "iboUSDC": {
    title: "iboUSDC",
    address: "0x812668fd9e61ccc7e7bccb0c7f75b1362cd070de",
    iconSrc: "/static/images/tokens/token-KUSDC.svg?date=20220929",
    decimals: singleTokens["oUSDC"].decimals,
    minDebtSize: new BigNumber(100 * 10 ** 6).toString(),

    originalToken: singleTokens.oUSDC,
  },
}

// REAL
// key: ibToken address
// * ORDER IS IMPORTANT * order should be same with lending pool tokens!!
export const debtTokens = {
  [ibTokens.ibWEMIX.address]: {
    pid: 5,
    title: "WEMIX",
    address: "0xD9757c73997b4587eaBCFaF7FF3449d2568124Af",
    decimals: 18,
  },
  [ibTokens.ibKLAY.address]: {
    pid: 1,
    title: "KLAY",
    address: "0xf009bcB2F955B23c846dD0385352085988677DbC",
    decimals: 18,
  },
  [ibTokens.iboUSDT.address]: {
    pid: 3,
    title: "oUSDT",
    address: "0x5b23006A210410157783b25d6C029FBceD2a9d45",
    decimals: 18,
  },
  [ibTokens.ibKDAI.address]: {
    pid: 7,
    title: "KDAI",
    address: "0xBc0a901DB4e73C79A5d548672ed8F49132a4595D",
    decimals: 18,
  },
  [ibTokens.iboETH.address]: {
    pid: 19,
    title: "oETH",
    address: "0x60E16d6Bc59c2499b745c0d46828A047F95013a7",
    decimals: 18,
  },
  [ibTokens.ibKLEVA.address]: {
    pid: 9,
    title: "KLEVA",
    address: "0xD04895719347Dd120EDce247504f6B9c6262b3fb",
    decimals: 18,
  },
  [ibTokens.iboUSDC.address]: {
    pid: 26,
    title: "oUSDC",
    address: "0x6346a43803a8ae8d63b04fff7ced9556c5d36a08",
    decimals: 18,
  },
}

export const singleTokensByAddress = Object.values(singleTokens).reduce((acc, cur) => {
  acc[cur.address] = cur
  acc[cur.address.toLowerCase()] = cur
  return acc
}, {})

const _lpTokenByIngredients = Object.values(lpTokens).reduce((acc, cur) => {
  acc[`${cur.ingredients[0].address.toLowerCase()}-${cur.ingredients[1].address.toLowerCase()}`] = cur
  acc[`${cur.ingredients[1].address.toLowerCase()}-${cur.ingredients[0].address.toLowerCase()}`] = cur
  return acc
}, {})

export const lpTokenByIngredients = (tokenA, tokenB) => {
  return _lpTokenByIngredients[`${tokenA && tokenA.address.toLowerCase()}-${tokenB && tokenB.address.toLowerCase()}`]
}

export const lpTokenByAddress = Object.values(lpTokens).reduce((acc, cur) => {
  acc[cur.address] = cur
  return acc
}, {})

export const ibTokenByAddress = Object.values(ibTokens).reduce((acc, cur) => {
  acc[cur.address.toLowerCase()] = cur
  return acc
}, {})

export const getIbTokenFromOriginalToken = (origialToken) => {
  return Object.values(ibTokens).find((ib) => {
    return ib.originalToken.address.toLowerCase() === origialToken.address.toLowerCase()
  })
}

export const getOriginalTokenFromIbToken = (ibToken) => {
  return Object.values(singleTokens).find((token) => {
    return isSameAddress(ibToken.originalToken.address, token.address)
  })
}

export const tokenList = {
  ...singleTokens,
  ...ibTokens,
  ...lpTokens,
}

export const tokenListByAddress = {
  ...singleTokensByAddress,
  ...lpTokenByAddress,
  ...ibTokenByAddress,
}

export const isKLAY = (address) => address === tokenList.KLAY.address