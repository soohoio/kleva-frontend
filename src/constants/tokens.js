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
    address: "0xF6F6b8Bd0aC500639148f8ca5a590341A97De0DE",
    iconSrc: "/static/images/tokens/token-KLAY.svg",
    decimals: 18,
  },
  // TEST
  "KLEVA": {
    title: "KLEVA",
    address: "0x5fFF3a6C16C2208103F318F4713D4D90601A7313",
    iconSrc: "/static/images/tokens/token-KLEVA.svg",
    decimals: 18,
  },
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
    iconSrc: "/static/images/tokens/token-KUSDC.svg",
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
  
  "KLEVA-KUSDT LP": {
    KSLP: true,
    ingredients: [singleTokens.KLEVA, singleTokens.KUSDT],
    title: "KLEVA-KUSDT LP",
    address: "0x0b5dBD999eEda642B1B2F93B5034A9155456f5Fc",
    decimals: 18,
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

export const ibTokens = {
  "ibKLAY": {
    title: "ibKLAY",
    address: "0xa691c5891D8a98109663d07Bcf3ED8d3edef820A",
    iconSrc: "/static/images/tokens/token-KLAY.svg",
    decimals: singleTokens["WKLAY"].decimals,

    originalToken: singleTokens.KLAY,
  },
  "ibKUSDT": {
    title: "ibKUSDT",
    address: "0xfAeeC9B2623b66BBB3545cA24cFc32A8504fcF1B",
    iconSrc: "/static/images/tokens/token-KUSDT.svg",
    decimals: singleTokens["KUSDT"].decimals,

    originalToken: singleTokens.KUSDT,
  },
  "ibWEMIX": {
    title: "ibWEMIX",
    address: "0xD429914222b7474Ea2C288Ec581D303599EeD137",
    iconSrc: "/static/images/tokens/token-WEMIX.png",
    decimals: singleTokens["WEMIX"].decimals,

    originalToken: singleTokens.WEMIX,
  },
  "ibKDAI": {
    title: "ibKDAI",
    address: "0x58770d59238B99Bd75c4298E33c6493eC4F17E2C",
    iconSrc: "/static/images/tokens/token-KDAI.png",
    decimals: singleTokens["KDAI"].decimals,

    originalToken: singleTokens.KDAI,
  },
  "ibKLEVA": {
    title: "ibKLEVA",
    address: "0x7fFc4146B43cD099928a813b2c219Af2e49611E0",
    iconSrc: "/static/images/tokens/token-KLEVA.svg",
    decimals: singleTokens["KLEVA"].decimals,

    originalToken: singleTokens.KLEVA,
  },
}

export const getIbTokenFromOriginalToken = (origialToken) => {
  return Object.values(ibTokens).find((ib) => {
    return ib.originalToken.address.toLowerCase() === origialToken.address.toLowerCase()
  })
}

// key: ibToken address
export const debtTokens = {
  [ibTokens.ibKLAY.address]: {
    pid: 1,
    title: "KLAY",
    address: "0xf009bcB2F955B23c846dD0385352085988677DbC",
    decimals: 18,
  },
  [ibTokens.ibKLEVA.address]: {
    pid: 3,
    title: "KLEVA",
    address: "0x5b23006A210410157783b25d6C029FBceD2a9d45",
    decimals: 18,
  },
  [ibTokens.ibKUSDT.address]: {
    pid: 5,
    title: "KUSDT",
    address: "0xD9757c73997b4587eaBCFaF7FF3449d2568124Af",
    decimals: 18,
  },
  [ibTokens.ibWEMIX.address]: {
    pid: 7,
    title: "WEMIX",
    address: "0xBc0a901DB4e73C79A5d548672ed8F49132a4595D",
    decimals: 18,
  },
  [ibTokens.ibKDAI.address]: {
    pid: 9,
    title: "KDAI",
    address: "0xD04895719347Dd120EDce247504f6B9c6262b3fb",
    decimals: 18,
  },
}

export const tokenList = {
  ...singleTokens,
  ...ibTokens,
  ...lpTokens,
}