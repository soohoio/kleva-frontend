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
    address: "0xd5Cb7B8Ee3b6Cecb9b175EF59A1006644CaDc037",
    iconSrc: "/static/images/tokens/token-KLAY.svg",
    decimals: 18,
  },
  "KLEVA": {
    title: "KLEVA",
    address: "0x091E05B1394828F5f0b6893705C1CeD042eCC2DE",
    iconSrc: "/static/images/tokens/token-KLEVA.svg",
    decimals: 18,
  },
  "KUSDT": {
    title: "KUSDT",
    address: "0x9ED0B4AB1549309a1a805Cd172D0A7d1C4D2935C",
    iconSrc: "/static/images/tokens/token-KUSDT.svg",
    decimals: 6,
  },
  "KSP": {
    title: "KSP",
    address: "0x47Eb738486D6815c51aEDe167087FCA763C3f23e",
    iconSrc: "/static/images/tokens/token-KSP.svg",
    decimals: 18,
  }, 
  "KDAI": {
    title: "KDAI",
    address: "0xdFE17a090Ce56D689139C7C5Ea6F46C00497b7de",
    iconSrc: "/static/images/tokens/token-KDAI.png",
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

  "KUSDT-KDAI LP": {
    KSLP: true,
    ingredients: [singleTokens.KUSDT, singleTokens.KDAI],
    title: "KUSDT-KDAI LP",
    address: "0x453fC6C6EB76e0605E38c7768D7a918bd8C0299B",
    decimals: 6,
  }
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
  "ibKUSDT": {
    title: "ibKUSDT",
    address: "0xE08Fe21332Ba5f1D085d53C7DaF2B627a05A9b7D",
    iconSrc: "/static/images/tokens/token-KUSDT.svg",
    decimals: singleTokens["KUSDT"].decimals,
    minDebtSize: "100000000",

    originalToken: singleTokens.KUSDT,
  }
}

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
  [ibTokens.ibKUSDT.address]: {
    pid: 1,
    title: "KUSDT",
    address: "0x8751281Cd9C71B60c407668f68E79fCCAdA31A87",
    decimals: 18,
  }
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