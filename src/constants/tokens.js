import BigNumber from 'bignumber.js'
import { isSameAddress } from '../utils/misc'

export const singleTokens = {
  "KLAY": {
    title: "KLAY",
    address: "0x0000000000000000000000000000000000000000",
    iconSrc: "/static/images/tokens/token-KLAY.svg",
    decimals: 18,
    nativeCoin: true,
  },
  "WKLAY": {
    title: "WKLAY",
    address: "0xd2F5648a9fCADc8F4Aab744bd8b20D1973DCf1dB",
    iconSrc: "/static/images/tokens/token-KLAY.svg",
    decimals: 18,
  },
  // REAL
  
  "KLEVA": {
    title: "KLEVA",
    address: "0x14F4167f10468e8ef7099297fB6943405992fAA5",
    iconSrc: "/static/images/tokens/token-KLEVA.svg",
    decimals: 18,
  },
  
  // TEST
  // "KLEVA": {
  //   title: "KLEVA",
  //   address: "0x0b430ad7bf84eb307e221f0e66216205502f835d",
  //   iconSrc: "/static/images/tokens/token-KLEVA.svg",
  //   decimals: 18,
  // },
  "KUSDT": {
    title: "KUSDT",
    address: "0xcee8faf64bb97a73bb51e115aa89c17ffa8dd167",
    iconSrc: "/static/images/tokens/token-KUSDT.svg",
    decimals: 6,
  },
  "KSP": {
    title: "KSP",
    address: "0xc6a2ad8cc6e4a7e08fc37cc5954be07d499e7654",
    iconSrc: "/static/images/tokens/token-KSP.svg",
    decimals: 18,
  }, 
  
  "WEMIX": {
    title: "WEMIX",
    address: "0x5096db80b21ef45230c9e423c373f1fc9c0198dd",
    iconSrc: "/static/images/tokens/token-WEMIX.png",
    decimals: 18,
  }, 
  "KDAI": {
    title: "KDAI",
    address: "0x5c74070fdea071359b86082bd9f9b3deaafbe32b",
    iconSrc: "/static/images/tokens/token-KDAI.png",
    decimals: 18,
  }, 
  "KUSDC": {
    title: "KUSDC",
    address: "0x754288077d0ff82af7a5317c7cb8c444d421d103",
    iconSrc: "/static/images/tokens/token-KUSDC.png",
    decimals: 6,
  }, 
  "KBUSD": {
    title: "KBUSD",
    address: "0x210bc03f49052169d5588a52c317f71cf2078b85",
    iconSrc: "/static/images/tokens/token-KBUSD.svg",
    decimals: 18,
  }, 
  "KETH": {
    title: "KETH",
    address: "0x34d21b1e550d73cee41151c77f3c73359527a396",
    iconSrc: "/static/images/tokens/token-KETH.svg",
    decimals: 18,
  }, 
  "KXRP": {
    title: "KXRP",
    address: "0x9eaefb09fe4aabfbe6b1ca316a3c36afc83a393f",
    iconSrc: "/static/images/tokens/token-KXRP.svg",
    decimals: 6,
  }, 
  "BORA": {
    title: "BORA",
    address: "0x02cbe46fb8a1f579254a9b485788f2d86cad51aa",
    iconSrc: "/static/images/tokens/token-BORA.png",
    decimals: 18,
  },
}

export const singleTokensByAddress = Object.values(singleTokens).reduce((acc, cur) => {
  acc[cur.address] = cur
  acc[cur.address.toLowerCase()] = cur
  return acc
}, {})

export const lpTokens = {
  // Token A - Token B

  "KLAY-KUSDT LP": {
    KSLP: true,
    ingredients: [singleTokens.KLAY, singleTokens.KUSDT],
    title: "KLAY-KUSDT LP",
    address: "0xD83f1B074D81869EFf2C46C530D7308FFEC18036",
    decimals: 18,
  },

  "KLAY-KSP LP": {
    KSLP: true,
    ingredients: [singleTokens.KLAY, singleTokens.KSP],
    title: "KLAY-KSP LP",
    address: "0x34cF46c21539e03dEb26E4FA406618650766f3b9",
    decimals: 18,
  },

  "KLAY-KETH LP": {
    KSLP: true,
    ingredients: [singleTokens.KLAY, singleTokens.KETH],
    title: "KLAY-KETH LP",
    address: "0x27F80731dDdb90C51cD934E9BD54bfF2D4E99e8a",
    decimals: 18,
  },

  "KLAY-KXRP LP": {
    KSLP: true,
    ingredients: [singleTokens.KLAY, singleTokens.KXRP],
    title: "KLAY-KXRP LP",
    address: "0x86E614ef51B305C36a0608bAa57fcaaa45844D87",
    decimals: 18,
  },

  "KLAY-WEMIX LP": {
    KSLP: true,
    ingredients: [singleTokens.KLAY, singleTokens.WEMIX],
    title: "KLAY-WEMIX LP",
    address: "0x917EeD7ae9E7D3b0D875dd393Af93fFf3Fc301F8",
    decimals: 18,
  },

  "KUSDT-KUSDC LP": {
    KSLP: true,
    ingredients: [singleTokens.KUSDT, singleTokens.KUSDC],
    title: "KUSDT-KUSDC LP",
    address: "0x2e9269b718cc816de6a9e3c27e5bdb0f6a01b0ac",
    decimals: 6,
  },
  
  "KUSDT-KDAI LP": {
    KSLP: true,
    ingredients: [singleTokens.KUSDT, singleTokens.KDAI],
    title: "KUSDT-KDAI LP",
    address: "0xc320066b25b731a11767834839fe57f9b2186f84",
    decimals: 6,
  },
  
  "KETH-KUSDT LP": {
    KSLP: true,
    ingredients: [singleTokens.KETH, singleTokens.KUSDT],
    title: "KETH-KUSDT LP",
    address: "0x029e2a1b2bb91b66bd25027e1c211e5628dbcb93",
    decimals: 18,
  },

  "KUSDT-WEMIX LP": {
    KSLP: true,
    ingredients: [singleTokens.KUSDT, singleTokens.WEMIX],
    title: "KUSDT-WEMIX LP",
    address: "0x2D803838Cb2D40EaCB0207ec4E567e2a8886b47F",
    decimals: 6,
  },
  "KLAY-BORA LP": {
    KSLP: true,
    ingredients: [singleTokens.KLAY, singleTokens.BORA],
    title: "KLAY-BORA LP",
    address: "0xbbcA9B2D17987aCE3E98E376931c540270CE71bB",
    decimals: 18,
  },

  "KETH-KXRP LP": {
    KSLP: true,
    ingredients: [singleTokens.KETH, singleTokens.KXRP],
    title: "KETH-KXRP LP",
    address: "0x85eF87815bD7BE28BEe038Ff201dB78c7E0eD2B9",
    decimals: 18,
  },

  "KXRP-KDAI LP": {
    KSLP: true,
    ingredients: [singleTokens.KXRP, singleTokens.KDAI],
    title: "KXRP-KDAI LP",
    address: "0x4B50d0e4F29bF5B39a6234B11753fDB3b28E76Fc",
    decimals: 6,
  },
}

const _lpTokenByIngredients = Object.values(lpTokens).reduce((acc, cur) => {
  acc[`${cur.ingredients[0].address.toLowerCase()}-${cur.ingredients[1].address.toLowerCase()}`] = cur
  acc[`${cur.ingredients[1].address.toLowerCase()}-${cur.ingredients[0].address.toLowerCase()}`] = cur
  return acc
}, {})

export const lpTokenByIngredients = (tokenA, tokenB) => {
  return _lpTokenByIngredients[`${tokenA && tokenA.address.toLowerCase()}-${tokenB && tokenB.address.toLowerCase()}`]
}

// REAL
export const ibTokens = {
  "ibKLAY": {
    title: "ibKLAY",
    address: "0xE1BaF917449406bAbd42E75EE578400f5F45A372",
    iconSrc: "/static/images/tokens/token-KLAY.svg",
    decimals: singleTokens["WKLAY"].decimals,
    minDebtSize: new BigNumber("0x02b5e3af16b1880000").toString(),

    originalToken: singleTokens.KLAY,
  },
  "ibKUSDT": {
    title: "ibKUSDT",
    address: "0x438cc574FCc3905a93B26b4aCFC71E9d7321ae66",
    iconSrc: "/static/images/tokens/token-KUSDT.svg",
    decimals: singleTokens["KUSDT"].decimals,
    minDebtSize: new BigNumber(100 * 10 ** 6).toString(),

    originalToken: singleTokens.KUSDT,
  },
  "ibWEMIX": {
    title: "ibWEMIX",
    address: "0xd4144E86665757C80f3C684063cB7D645F017C72",
    iconSrc: "/static/images/tokens/token-WEMIX.png",
    decimals: singleTokens["WEMIX"].decimals,
    minDebtSize: new BigNumber("0x8ac7230489e80000").toString(),

    originalToken: singleTokens.WEMIX,
  },
  "ibKDAI": {
    title: "ibKDAI",
    address: "0xB03D2ab76A84fa753448eb5B165A781320900375",
    iconSrc: "/static/images/tokens/token-KDAI.png",
    decimals: singleTokens["KDAI"].decimals,
    minDebtSize: new BigNumber("0x056bc75e2d63100000").toString(),

    originalToken: singleTokens.KDAI,
  },
  "ibKLEVA": {
    title: "ibKLEVA",
    address: "0xbd0A90f121fdAB2c8C88e4240C9a179C19cB2184",
    iconSrc: "/static/images/tokens/token-KLEVA.svg",
    decimals: singleTokens["KLEVA"].decimals,
    minDebtSize: new BigNumber("0x02b5e3af16b1880000").toString(),

    originalToken: singleTokens.KLEVA,
  },
  "ibKETH": {
    title: "ibKETH",
    address: "0xade6138b7A3b4D2bBa0C9Fc5AA8bD4be19F32Be8",
    iconSrc: "/static/images/tokens/token-KETH.svg",
    decimals: singleTokens["KETH"].decimals,
    minDebtSize: new BigNumber("0x02b5e3af16b1880000").toString(),

    originalToken: singleTokens.KETH,
  },
}

// TEST
// export const ibTokens = {
//   "ibKLAY": {
//     title: "ibKLAY",
//     address: "0xF39787715B743Ab118FD36Cb8a836bC54624e5b8",
//     iconSrc: "/static/images/tokens/token-KLAY.svg",
//     decimals: singleTokens["WKLAY"].decimals,

//     originalToken: singleTokens.KLAY,
//   },
//   "ibKUSDT": {
//     title: "ibKUSDT",
//     address: "0x77a767F6DE81bD85A52FFB2c8e4121f43137aD3F",
//     iconSrc: "/static/images/tokens/token-KUSDT.svg",
//     decimals: singleTokens["KUSDT"].decimals,

//     originalToken: singleTokens.KUSDT,
//   },
//   "ibWEMIX": {
//     title: "ibWEMIX",
//     address: "0x8DBC74D59aE4d0D0f6a389F0174A1cFFf0C2778f",
//     iconSrc: "/static/images/tokens/token-WEMIX.png",
//     decimals: singleTokens["WEMIX"].decimals,

//     originalToken: singleTokens.WEMIX,
//   },
//   "ibKDAI": {
//     title: "ibKDAI",
//     address: "0x292fa4ab3585E697da21BC274A13dDe85cdDa1d1",
//     iconSrc: "/static/images/tokens/token-KDAI.png",
//     decimals: singleTokens["KDAI"].decimals,

//     originalToken: singleTokens.KDAI,
//   },
//   "ibKLEVA": {
//     title: "ibKLEVA",
//     address: "0x4b1A8c88443f4d7cF35afd0171eAd25AeF338428",
//     iconSrc: "/static/images/tokens/token-KLEVA.svg",
//     decimals: singleTokens["KLEVA"].decimals,

//     originalToken: singleTokens.KLEVA,
//   },
// }

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

// REAL
// key: ibToken address
// * ORDER IS IMPORTANT * order should be same with lending pool tokens!!
export const debtTokens = {
  [ibTokens.ibWEMIX.address]: {
    pid: 5,
    title: "WEMIX",
    address: "0x3Dd015D2f6Ee247b97303Ca923bB2d827b8Bcfb3",
    decimals: 18,
  },
  [ibTokens.ibKLAY.address]: {
    pid: 1,
    title: "KLAY",
    address: "0x20ea81a61F3585C813afADF1d9ac9DA94cbedAB3",
    decimals: 18,
  },
  [ibTokens.ibKUSDT.address]: {
    pid: 3,
    title: "KUSDT",
    address: "0xd1BD66D36f7a5C1f91e6458a052fA125063A17Ee",
    decimals: 18,
  },
  [ibTokens.ibKDAI.address]: {
    pid: 7,
    title: "KDAI",
    address: "0x59340A08870344B85FeC2e429869d059cD2236ec",
    decimals: 18,
  },
  [ibTokens.ibKLEVA.address]: {
    pid: 9,
    title: "KLEVA",
    address: "0x576c54661f24935EE6Dc1e6CBd2b212E3daC8F84",
    decimals: 18,
  },
  [ibTokens.ibKETH.address]: {
    pid: 11,
    title: "KETH",
    address: "0x3253446c35aDcf3C746e2C984FE9558d56EACb8c",
    decimals: 18,
  },
}

// // TEST
// export const debtTokens = {
//   [ibTokens.ibKLAY.address]: {
//     pid: 1,
//     title: "KLAY",
//     address: "0x1EDC9f844FF72f6034C08D1FBD265d0e17BFcd51",
//     decimals: 18,
//   },
//   [ibTokens.ibKLEVA.address]: {
//     pid: 3,
//     title: "KLEVA",
//     address: "0xa07B54031Fdc9Dd22cA635198D71097c6353f559",
//     decimals: 18,
//   },
//   [ibTokens.ibKUSDT.address]: {
//     pid: 5,
//     title: "KUSDT",
//     address: "0x9d3F14B57c9D47d8FA076948f8e08CC2b8933042",
//     decimals: 18,
//   },
//   [ibTokens.ibWEMIX.address]: {
//     pid: 7,
//     title: "WEMIX",
//     address: "0x1Ff8366eEAF75Cc5c793F1145BA18C2635AfeFe6",
//     decimals: 18,
//   },
//   [ibTokens.ibKDAI.address]: {
//     pid: 9,
//     title: "KDAI",
//     address: "0xB481778883aB56C834cb18D2633803687261E368",
//     decimals: 18,
//   },
// }

export const tokenList = {
  ...singleTokens,
  ...ibTokens,
  ...lpTokens,
}