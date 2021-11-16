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
    address: "0xa47106A476d57560DEc041fceCE464F7A6c8e39b",
    iconSrc: "/static/images/tokens/token-KLEVA.svg",
    decimals: 18,
  },
  "KUSDT": {
    title: "KUSDT",
    address: "0xcee8faf64bb97a73bb51e115aa89c17ffa8dd167",
    iconSrc: "/static/images/tokens/token-KUSDT.svg",
    decimals: 6,
  },


//   "BNB": {
//     title: "BNB",
//     address: "0x0000000000000000000000000000000000000000",
//     iconSrc: "/static/images/tokens/token-BNB.svg",
//     decimals: 18,
//     nativeCoin: true,
//   },
//   "WBNB": {
//     title: "WBNB",
//     address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
//     iconSrc: "/static/images/tokens/token-BNB.svg",
//     decimals: 18,
//   },
//   "ALPACA": {
//     title: "ALPACA",
//     address: "0x8f0528ce5ef7b51152a59745befdd91d97091d2f",
//     iconSrc: "/static/images/tokens/token-ALPACA.svg",
//     decimals: 18,
//   },
//   "BUSD": {
//     title: "BUSD",
//     address: "0xe9e7cea3dedca5984780bafc599bd69add087d56",
//     iconSrc: "/static/images/tokens/token-BUSD.svg",
//     decimals: 18,
//   },
//   "USDT": {
//     title: "USDT",
//     address: "0x55d398326f99059ff775485246999027b3197955",
//     iconSrc: "/static/images/tokens/token-USDT.svg",
//     decimals: 18,
//   },
//   "TUSD": {
//     title: "TUSD",
//     address: "0x14016e85a25aeb13065688cafb43044c2ef86784",
//     iconSrc: "/static/images/tokens/token-TUSD.svg",
//     decimals: 18,
//   },
//   "BTCB": {
//     title: "BTCB",
//     address: "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c",
//     iconSrc: "/static/images/tokens/token-BTCB.svg",
//     decimals: 18,
//   },
//   "ETH": {
//     title: "ETH",
//     address: "0x2170ed0880ac9a755fd29b2688956bd959f933f8",
//     iconSrc: "/static/images/tokens/token-ETH.svg",
//     decimals: 18,
//   },
}

export const ibTokens = {
  "ibKLAY": {
    title: "ibKLAY",
    address: "0x5ECb3953DAE2F8b5556422Fb0F175447A69a7929",
    iconSrc: "/static/images/tokens/token-KLAY.svg",
    decimals: singleTokens["WKLAY"].decimals,
  },
  "ibKLEVA": {
    title: "ibKLEVA",
    address: "0x7063D05A70438bA589cCfc9EadE1f677Fd77f532",
    iconSrc: "/static/images/tokens/token-KLEVA.svg",
    decimals: singleTokens["KLEVA"].decimals,
  },
  "ibKUSDT": {
    title: "ibKUSDT",
    address: "0x1Beb04E1F9578fAbB9278c5a08c2c5167B641cA1",
    iconSrc: "/static/images/tokens/token-KUSDT.svg",
    decimals: singleTokens["KUSDT"].decimals,
  },

  // "ibALPACA": {
  //   title: "ibALPACA",
  //   address: "0xf1bE8ecC990cBcb90e166b71E368299f0116d421",
  //   iconSrc: "/static/images/tokens/token-ALPACA.svg",
  //   decimals: singleTokens["ALPACA"].decimals,
  // },
  // "ibBNB": {
  //   title: "ibBNB",
  //   address: "0xd7D069493685A581d27824Fc46EdA46B7EfC0063",
  //   iconSrc: "/static/images/tokens/token-BNB.svg",
  //   decimals: singleTokens["WBNB"].decimals,
  // },
  // "ibBUSD": {
  //   title: "ibBUSD",
  //   address: "0x7C9e73d4C71dae564d41F78d56439bB4ba87592f",
  //   iconSrc: "/static/images/tokens/token-BUSD.svg",
  //   decimals: singleTokens["BUSD"].decimals,
  // },
  // "ibUSDT": {
  //   title: "ibUSDT",
  //   address: "0x158Da805682BdC8ee32d52833aD41E74bb951E59",
  //   iconSrc: "/static/images/tokens/token-USDT.svg",
  //   decimals: singleTokens["USDT"].decimals,
  // },
  // "ibTUSD": {
  //   title: "ibTUSD",
  //   address: "0x3282d2a151ca00BfE7ed17Aa16E42880248CD3Cd",
  //   iconSrc: "/static/images/tokens/token-TUSD.svg",
  //   decimals: singleTokens["TUSD"].decimals,
  // },
  // "ibBTCB": {
  //   title: "ibBTCB",
  //   address: "0x08FC9Ba2cAc74742177e0afC3dC8Aed6961c24e7",
  //   iconSrc: "/static/images/tokens/token-BTCB.svg",
  //   decimals: singleTokens["BTCB"].decimals,
  // },
  // "ibETH": {
  //   title: "ibETH",
  //   address: "0xbfF4a34A4644a113E8200D7F1D79b3555f723AfE",
  //   iconSrc: "/static/images/tokens/token-ETH.svg",
  //   decimals: singleTokens["ETH"].decimals,
  // },
}

export const lpTokens = {

}

export const tokenList = {
  ...singleTokens,
  ...ibTokens,
  ...lpTokens,
}