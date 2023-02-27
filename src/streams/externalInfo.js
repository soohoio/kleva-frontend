import BigNumber from 'bignumber.js'
import { from, forkJoin, of } from 'rxjs'
import { switchMap, tap, map } from 'rxjs/operators'
import { AIRDROP_DATA, KLAYSWAP_DUMMY_DATA, KLAY_PRICE } from '../constants/dummy'
import { calcBestPathToKLAY, getAmountOut } from '../utils/optimalPath'

const fetch$ = (url) => from(fetch(url)).pipe(
  tap((res) => {
    console.log(res, 'res')
  }),
  switchMap((res) => from(res.json()))
)

export const _fetchKlayswapInfo$ = () => {
  return forkJoin(
    of(KLAY_PRICE),
    of(KLAYSWAP_DUMMY_DATA),
    of(AIRDROP_DATA),
    // fetch$("https://ss.klayswap.com/stat/klayPrice.json"),
    // fetch$("https://ss.klayswap.com/stat/klayswapInfo.json"),
    // fetch$(`https://ss.klayswap.com/stat/airdropInfo.min.json?t=${new Date().getTime()}`),
  ).pipe(
    map(([klayPrice, klayswapInfo, _airdropInfo]) => {
      console.log(klayPrice, 'klayPrice')
      console.log(klayswapInfo, 'klayswapInfo')

      console.log(_airdropInfo, '_airdropInfo')

      const airdropInfo = _airdropInfo
        .filter((pool) => pool[13] === true) // 13: isActive
        .reduce((acc, cur) => {
          const [
            poolAddr,
            id,
            address,
            symbol,
            decimals,
            totalDistributed,
            lastDistributed,
            distributionRate,
            distributionIndex,
            distributePerBlock,
            distributePerDay,
            distributePerYear,
            totalDistribute,
            isActive
          ] = cur

          acc[poolAddr] = acc[poolAddr] || {}

          acc[poolAddr] = {
            ...acc[poolAddr],
            [address]: distributePerYear / 10 ** decimals,
          }

          return acc
        }, {})

      const aggregateResult = aggregate(klayPrice, klayswapInfo, airdropInfo)

      return aggregateResult
    })
  )
}

export const aggregate = (klayPrice, klayswapInfo, airdropInfo) => {
  const recentPoolInfo = klayswapInfo && klayswapInfo.recentPoolInfo.map((poolInfo) => {
    return {
      exchange_address: poolInfo.exchange_address,
      tokenA: poolInfo.tokenA,
      tokenB: poolInfo.tokenB,
      amountA: poolInfo.amountA,
      amountB: poolInfo.amountB,
      supply: poolInfo.supply,
      poolVolume: poolInfo.poolVolume,
      decimals: poolInfo.decimals,
      lastHourTradeTotalVolume: poolInfo.lastHourTradeTotalVolume,
      kspRewardRate: poolInfo.kspRewardRate,
      feeRewardRate: poolInfo.feeRewardRate,
      airdropRewardRate: poolInfo.airdropRewardRate.reduce((acc, cur) => {
        return new BigNumber(acc).plus(cur.rate).toString()
      }, 0)
    }
  })

  const poolInfoByToken = recentPoolInfo.reduce((acc, cur) => {

    acc[`${cur.tokenA}-${cur.tokenB}`] = cur

    acc[`${cur.tokenB}-${cur.tokenA}`] = cur

    return acc
  }, {})

  const tokenInfoBySymbol = klayswapInfo && klayswapInfo.tokenInfo.reduce((acc, cur) => {
    acc[cur.symbol] = cur
    return acc
  }, {})

  const tokenInfoByAddress = klayswapInfo && klayswapInfo.tokenInfo.reduce((acc, cur) => {
    acc[cur.address] = cur
    return acc
  }, {})

  const bestKLAYpath = calcBestPathToKLAY(recentPoolInfo, tokenInfoBySymbol)

  const priceOutput = bestKLAYpath.reduce((acc, paths) => {
    const fromToken = paths[0]
    let amountTemp = 10 ** tokenInfoByAddress[fromToken].decimal

    for (var i = 0; i < paths.length - 1; i++) {
      const poolInfo = poolInfoByToken[`${paths[i]}-${paths[i + 1]}`] || poolInfoByToken[`${paths[i + 1]}-${paths[i]}`]

      if (paths[i] === poolInfo.tokenA) {
        // const tokenAInfo = tokenInfoByAddress[poolInfo.tokenA]

        amountTemp = getAmountOut(amountTemp, poolInfo.amountA, poolInfo.amountB)

        // acc[poolInfo.tokenA] = (getAmountOut(10 ** tokenAInfo.decimal, poolInfo.amountA, poolInfo.amountB) / 10 ** 18) * klayPrice
      } else if (paths[i] === poolInfo.tokenB) {
        // const tokenBInfo = tokenInfoByAddress[poolInfo.tokenB]

        amountTemp = getAmountOut(amountTemp, poolInfo.amountB, poolInfo.amountA)
        // acc[poolInfo.tokenB] = (getAmountOut(10 ** tokenBInfo.decimal, poolInfo.amountB, poolInfo.amountA) / 10 ** 18) * klayPrice
      }

      if (i === paths.length - 2) {
        acc[fromToken] = (amountTemp / 10 ** 18) * klayPrice
      }
    }

    return acc
  }, {})

  const lpPriceOutput = recentPoolInfo.reduce((acc, cur) => {
    const tokenAdecimal = tokenInfoByAddress[cur.tokenA].decimal
    const tokenBdecimal = tokenInfoByAddress[cur.tokenB].decimal
    const tempA = (((cur.amountA * 2) / 10 ** tokenAdecimal) * priceOutput[cur.tokenA]) / (cur.supply / 10 ** cur.decimals)
    const tempB = (((cur.amountB * 2) / 10 ** tokenBdecimal) * priceOutput[cur.tokenB]) / (cur.supply / 10 ** cur.decimals)
    acc[cur.exchange_address] = tempA || tempB
    return acc
  }, {})

  const recentPoolInfoLpTokenMap = recentPoolInfo.reduce((acc, cur) => {
    acc[cur.exchange_address] = cur
    return acc
  }, {})

  return {
    klayPrice,
    airdropInfo,
    recentPoolInfo: recentPoolInfoLpTokenMap,
    priceOutput: { ...priceOutput, ...lpPriceOutput },
  }
}