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
    address: "0x045cfbeA9E160eD1471ADd4ea6b9e00ffeeD321A",
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

export const ibTokens = {
  "ibKLAY": {
    title: "ibKLAY",
    address: "0x998B6714b45363adD63231fb68362c686D45cDF6",
    iconSrc: "/static/images/tokens/token-KLAY.svg",
    decimals: singleTokens["WKLAY"].decimals,

    originalToken: singleTokens.KLAY,
  },
  "ibKLEVA": {
    title: "ibKLEVA",
    address: "0x0b3CC19a21DC88e86C59929DFCAd23d81D4298dB",
    iconSrc: "/static/images/tokens/token-KLEVA.svg",
    decimals: singleTokens["KLEVA"].decimals,

    originalToken: singleTokens.KLEVA,
  },
  "ibKUSDT": {
    title: "ibKUSDT",
    address: "0x8E3259221E3e7D84D3d73c6807C21e00ac85fCc0",
    iconSrc: "/static/images/tokens/token-KUSDT.svg",
    decimals: singleTokens["KUSDT"].decimals,

    originalToken: singleTokens.KUSDT,
  },
}

export const lpTokens = {
  // Token A - Token B
  "KSP-KUSDT LP": {
    KSLP: true,
    ingredients: [singleTokens.KSP, singleTokens.KUSDT],
    title: "KSP-KUSDT LP",
    address: "0xE75a6A3a800A2C5123e67e3bde911Ba761FE0705",
    decimals: 18,
  },
}

export const tokenList = {
  ...singleTokens,
  ...ibTokens,
  ...lpTokens,
}