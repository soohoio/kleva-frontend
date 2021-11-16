import { tokenList } from "./tokens"

// Lending Pool Contract (= Vault Contract) (= ibToken Contract)
export const lendingPools = [

  {
    title: "KLAY",
    vaultAddress: "0x5ECb3953DAE2F8b5556422Fb0F175447A69a7929",
    stakingToken: tokenList["KLAY"],
    stakingTokenInternal: tokenList["WKLAY"],
  },
  {
    title: "KLEVA",
    vaultAddress: "0x7063D05A70438bA589cCfc9EadE1f677Fd77f532",
    stakingToken: tokenList["KLEVA"],
  },
  {
    title: "KUSDT",
    vaultAddress: "0x1Beb04E1F9578fAbB9278c5a08c2c5167B641cA1",
    stakingToken: tokenList["KUSDT"],
  },

  // WBNB
  // {
  //   title: "BNB",
  //   vaultAddress: "0xd7D069493685A581d27824Fc46EdA46B7EfC0063",
  //   stakingToken: tokenList["BNB"],
  //   stakingTokenInternal: tokenList["WBNB"],
  // },
  // {
  //   title: "BUSD",
  //   vaultAddress: "0x7C9e73d4C71dae564d41F78d56439bB4ba87592f",
  //   stakingToken: tokenList["BUSD"],
  // },
  // {
  //   title: "USDT",
  //   vaultAddress: "0x158Da805682BdC8ee32d52833aD41E74bb951E59",
  //   stakingToken: tokenList["USDT"],
  // },
  // {
  //   title: "TUSD",
  //   vaultAddress: "0x3282d2a151ca00BfE7ed17Aa16E42880248CD3Cd",
  //   stakingToken: tokenList["TUSD"],
  // },
  // {
  //   title: "BTCB",
  //   vaultAddress: "0x08FC9Ba2cAc74742177e0afC3dC8Aed6961c24e7",
  //   stakingToken: tokenList["BTCB"],
  // },
  // {
  //   title: "ETH",
  //   vaultAddress: "0xbfF4a34A4644a113E8200D7F1D79b3555f723AfE",
  //   stakingToken: tokenList["ETH"],
  // },
]