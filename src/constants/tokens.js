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

export const ibTokens = {
  "ibKLAY": {
    title: "ibKLAY",
    address: "0x0C952D740dF769FDec998776B8F4e727687CCC3A",
    iconSrc: "/static/images/tokens/token-KLAY.svg",
    decimals: singleTokens["WKLAY"].decimals,

    originalToken: singleTokens.KLAY,
  },
  "ibKLEVA": {
    title: "ibKLEVA",
    address: "0xE9e0901A825D32d0DB0e9aE47738d07F5F3c966F",
    iconSrc: "/static/images/tokens/token-KLEVA.svg",
    decimals: singleTokens["KLEVA"].decimals,

    originalToken: singleTokens.KLEVA,
  },
  "ibKUSDT": {
    title: "ibKUSDT",
    address: "0x0d5083559cb5E483DA4476DDCFcE004535221447",
    iconSrc: "/static/images/tokens/token-KUSDT.svg",
    decimals: singleTokens["KUSDT"].decimals,

    originalToken: singleTokens.KUSDT,
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
}

export const tokenList = {
  ...singleTokens,
  ...ibTokens,
  ...lpTokens,
}