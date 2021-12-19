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
    address: "0x70c6F26b0134567Cb218aAc9022E209Ed9C0b85f",
    iconSrc: "/static/images/tokens/token-KLAY.svg",
    decimals: 18,
  },
  "KLEVA": {
    title: "KLEVA",
    address: "0x0b430ad7bf84eb307e221f0e66216205502f835d",
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
  "KSP-KUSDT LP": {
    KSLP: true,
    ingredients: [singleTokens.KSP, singleTokens.KUSDT],
    title: "KSP-KUSDT LP",
    address: "0xE75a6A3a800A2C5123e67e3bde911Ba761FE0705",
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
  return _lpTokenByIngredients[`${tokenA.address.toLowerCase()}-${tokenB.address.toLowerCase()}`]
}

export const ibTokens = {
  "ibKLAY": {
    title: "ibKLAY",
    address: "0xF39787715B743Ab118FD36Cb8a836bC54624e5b8",
    iconSrc: "/static/images/tokens/token-KLAY.svg",
    decimals: singleTokens["WKLAY"].decimals,

    originalToken: singleTokens.KLAY,
  },
  "ibKLEVA": {
    title: "ibKLEVA",
    address: "0x4b1A8c88443f4d7cF35afd0171eAd25AeF338428",
    iconSrc: "/static/images/tokens/token-KLEVA.svg",
    decimals: singleTokens["KLEVA"].decimals,

    originalToken: singleTokens.KLEVA,
  },
  "ibKUSDT": {
    title: "ibKUSDT",
    address: "0x77a767F6DE81bD85A52FFB2c8e4121f43137aD3F",
    iconSrc: "/static/images/tokens/token-KUSDT.svg",
    decimals: singleTokens["KUSDT"].decimals,

    originalToken: singleTokens.KUSDT,
  },
  "ibWEMIX": {
    title: "ibWEMIX",
    address: "0x8DBC74D59aE4d0D0f6a389F0174A1cFFf0C2778f",
    iconSrc: "/static/images/tokens/token-WEMIX.png",
    decimals: singleTokens["WEMIX"].decimals,

    originalToken: singleTokens.WEMIX,
  },
  "ibKDAI": {
    title: "ibKDAI",
    address: "0x292fa4ab3585E697da21BC274A13dDe85cdDa1d1",
    iconSrc: "/static/images/tokens/token-KDAI.png",
    decimals: singleTokens["KDAI"].decimals,

    originalToken: singleTokens.KDAI,
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
  },
  [ibTokens.ibKLEVA.address]: {
    pid: 3,
  },
  [ibTokens.ibKUSDT.address]: {
    pid: 5,
  },
  [ibTokens.ibWEMIX.address]: {
    pid: 7,
  },
  [ibTokens.ibKDAI.address]: {
    pid: 9,
  },
}

export const tokenList = {
  ...singleTokens,
  ...ibTokens,
  ...lpTokens,
}