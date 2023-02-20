import Caver from 'caver-js'
import { forkJoin, from, interval, Observable, of, Subject } from 'rxjs'
import { tap, catchError, map, switchMap, startWith, filter, takeUntil } from 'rxjs/operators'
import { Interface } from '@ethersproject/abi'
import BigNumber from 'bignumber.js'
import { sample, flatten, pick, groupBy } from 'lodash'

import { MULTICALL, FAIRLAUNCH } from 'constants/address'
import { selectedAddress$ } from 'streams/wallet'
import { walletType$ } from 'streams/setting'

import MulticallABI from 'abis/Multicall.json'
import IERC20ABI from 'abis/IERC20.json'
// import VaultABI from 'abis/Vault.json'
import VaultABI from 'abis/VaultKleva.json'
// import FairLaunchABI from 'abis/FairLaunch.json'
import FairLaunchABI from 'abis/FairLaunchKleva.json'
import KlayswapWorkerABI from 'abis/KlayswapWorker.json'
import KlayswapMiningABI from 'abis/KlayswapMining.json'
import VaultConfigABI from 'abis/VaultConfig.json'
import KLEVATokenABI from 'abis/KLEVAToken.json'

// Klayswap 
import KlayswapExchangeABI from 'abis/KlayswapExchange.json'

// WKLAY
import WKLAYABI from 'abis/WKLAY.json'

// Klayswap Calculator
import KlayswapCalculatorABI from 'abis/KlayswapCalculator.json'

// KNS
import KNS_REVERSE_RECORDS_ABI from 'abis/KNS.json'

// Kokonutswap Calculator
import KokonutswapCalculatorABI from 'abis/KokonutswapCalculator.json'

import { closeLayeredModal$, closeModal$, isFocused$, isQrCodeModal$, layeredModalContentComponent$ } from './ui'
import { addressKeyFind, coupleArray } from '../utils/misc'
import { executeContractKlip$ } from './klip'

import { MAX_UINT } from 'constants/setting'
import { showParamsOnCall } from '../utils/callHelper'
import { getOriginalTokenFromIbToken, ibTokenByAddress, isKLAY, lpTokenByIngredients, singleTokensByAddress, tokenList } from '../constants/tokens'
import { isValidDecimal, toFixed } from '../utils/calc'
import { klayswapPoolInfo$ } from './farming'
import { currentBlockNumber$ } from 'streams/block'
import { tokenPrices$ } from './tokenPrice'
import { KLAYSWAP_CALCULATOR, KNS_REVERSE_RECORDS_ADDRESS, KOKONUTSWAP_CALCULATOR } from '../constants/address'
import { workerByAddress } from '../constants/workers'
import copy from 'copy-to-clipboard'

const kasOption = {
  headers: [
    { name: 'Authorization', value: "Basic S0FTS1RIQVhOSlBGWjRQUklURkZHNUozOjl4T19JMjRPMm5TU053NTF2RnZSTnVKRkVsQ3hYMXZQeHpPc1MteGo=" },
    { name: 'x-chain-id', value: '8217' },
  ]
}

const NODE_URL = 'https://klaytn-secure.staging.sooho.io/'
const NODE_3_URL = "https://en5.klayfi.finance"
const NODE_4_URL = "https://en6.klayfi.finance"
const NODE_5_URL = "https://nodepelican.com/"
const NODE_6_URL = "https://2.nodepelican.com/"
const NODE_7_URL = "https://klaytn01.fautor.app/"
const NODE_8_URL = "https://klaytn02.fautor.app/"
const NODE_9_URL = "https://klaytn03.fautor.app/"

export const caver_1 = new Caver(new Caver.providers.HttpProvider(NODE_URL, kasOption))
export const caver_3 = new Caver(new Caver.providers.HttpProvider(NODE_3_URL, kasOption))
export const caver_4 = new Caver(new Caver.providers.HttpProvider(NODE_4_URL, kasOption))
// export const caver_5 = new Caver(new Caver.providers.HttpProvider(NODE_5_URL, kasOption))
// export const caver_6 = new Caver(new Caver.providers.HttpProvider(NODE_6_URL, kasOption))
export const caver_7 = new Caver(new Caver.providers.HttpProvider(NODE_7_URL, kasOption))
export const caver_8 = new Caver(new Caver.providers.HttpProvider(NODE_8_URL, kasOption))
export const caver_9 = new Caver(new Caver.providers.HttpProvider(NODE_9_URL, kasOption))

export let caver = sample([
  // caver_1,
  // caver_2,
  // caver_3,
  // caver_4,
  // caver_5,
  // caver_6,
  caver_7,
  caver_8,
  caver_9,
])

const getBlockNumber$ = (web3Instance) => from(
  web3Instance.klay.getBlockNumber()
).pipe(
  catchError((err) => {
    return of(0)
  })
)

// Node change strategy
interval(3000).pipe(
  startWith(0),
  filter(() => {
    return isFocused$.value
  }),
  switchMap(() => forkJoin(
    // from(getBlockNumber$(caver_1).pipe(
    //   map((blockNumber) => ({ blockNumber, url: NODE_URL })),
    //   catchError(() => of({ blockNumber: 0, url: "" }))
    // )),
    // from(getBlockNumber$(caver_2).pipe(
    //   map((blockNumber) => ({ blockNumber, url: NODE_2_URL })),
    //   catchError(() => of({ blockNumber: 0, url: ""}))
    // )),
    // from(getBlockNumber$(caver_3).pipe(
    //   map((blockNumber) => ({ blockNumber, url: NODE_3_URL })),
    //   catchError(() => of({ blockNumber: 0, url: ""}))
    // )),
    // from(getBlockNumber$(caver_4).pipe(
    //   map((blockNumber) => ({ blockNumber, url: NODE_4_URL })),
    //   catchError(() => of({ blockNumber: 0, url: ""}))
    // )),
    // from(getBlockNumber$(caver_5).pipe(
    //   map((blockNumber) => ({ blockNumber, url: NODE_5_URL })),
    //   catchError(() => of({ blockNumber: 0, url: ""}))
    // )),
    // from(getBlockNumber$(caver_6).pipe(
    //   map((blockNumber) => ({ blockNumber, url: NODE_6_URL })),
    //   catchError(() => of({ blockNumber: 0, url: ""}))
    // )),
    from(getBlockNumber$(caver_7).pipe(
      map((blockNumber) => ({ blockNumber, url: NODE_7_URL })),
      catchError(() => of({ blockNumber: 0, url: ""}))
    )),
    from(getBlockNumber$(caver_8).pipe(
      map((blockNumber) => ({ blockNumber, url: NODE_8_URL })),
      catchError(() => of({ blockNumber: 0, url: ""}))
    )),
    from(getBlockNumber$(caver_9).pipe(
      map((blockNumber) => ({ blockNumber, url: NODE_9_URL })),
      catchError(() => of({ blockNumber: 0, url: ""}))
    )),
  )),
).subscribe((nodes) => {
  const bestNode = nodes.reduce((acc, cur) => {
    if (acc.blockNumber < cur.blockNumber) {
      acc.blockNumber = cur.blockNumber
      acc.url = cur.url
    }
    return acc
  })


  // const alreadySet = caver.klay.currentProvider.host === bestNode.url

  if (bestNode && bestNode.url) {
    currentBlockNumber$.next(bestNode.blockNumber)
    caver.setProvider(new Caver.providers.HttpProvider(bestNode.url, kasOption))
  }
})

window.BigNumber = BigNumber

getBlockNumber$(caver).subscribe(console.log)

// Library
export const willRevert$ = (method, txObject) => {
  txObject.value = '0x' + new BigNumber(txObject.value || 0).toString(16)

  return new Observable((observer) => {

    const gas$ = from(method.estimateGas({ from: selectedAddress$.value, value: txObject && txObject.value })).pipe(
      catchError((err) => {
        return of(err)
      })
    )

    return gas$.subscribe((gas) => {
      observer.next(gas instanceof Error ? true : false)
      observer.complete(gas instanceof Error ? true : false)
    })
  })
}

const sendAsync$ = (method, txObject) => {

  const pureValue = new BigNumber(txObject.value).toString()

  txObject.value = '0x' + new BigNumber(txObject.value || 0).toString(16)

  return new Observable((observer) => {

    const data = method.encodeABI()

    const gas$ = from(method.estimateGas({ from: selectedAddress$.value, value: txObject && txObject.value })).pipe(
      catchError((err) => {
        observer.error(err)
        return of(err)
      })
    )

    gas$.subscribe((gas) => {
      // if (gas instanceof Error) {
      //   alert("error occurred.")
      //   return
      // }

      // Klip

      if (walletType$.value === "klip") {
        executeContractKlip$({
          from: txObject.from,
          to: txObject.to,
          value: new BigNumber(txObject.value || 0).toString() || "0",
          abi: _method._method,
          params: method.arguments,
        }).pipe(
          catchError((e) => {
            return of(false)
          })
        ).subscribe((result) => {
          observer.next(result)
          observer.complete(result)

          // TODO?
          if (!isMobile) {
            if (layeredModalContentComponent$.value) {
              closeLayeredModal$.next(true)
              return
            }
            closeModal$.next(true)
          }
        })
        return
      }

      // Injected
      const _gasLowerBound = Number.isNaN(Math.min(40000000, gas))
        ? 7000000
        : Math.min(40000000, gas)

      const _gas = new BigNumber(_gasLowerBound)
        .multipliedBy(1.2)
        .toFixed(0)

      window.injected.sendAsync({
        method: window.injected && window.injected.isMetaMask
          ? 'eth_sendTransaction'
          : 'klay_sendTransaction',
        params: [{ ...txObject, data, gas: `0x${new BigNumber(_gas).toString(16)}` }],
        from: window.injected.selectedAddress
      }, (err, result) => {

        const userDenied = err === "user_canceled" 
          || (result && result.error && result.error.message && result.error.message.indexOf('denied'))

        if (userDenied) {
          observer.complete(result)
          return
        }

        const _err = (err || (result && result.error && result.error.message))
        if (_err) {
          observer.next(new Error(_err))
          observer.complete(new Error(_err))
          return
        }

        observer.next(result)
        observer.complete(result)
      })
    })
  })
}

const makeTransaction = ({ abi, address, methodName, params, value, checkRevert }) => {
  // const _contract = new caver.klay.Contract(abi, address)
  const _contract = new caver.klay.Contract(abi, address)
  const _method = _contract.methods[methodName](...params)

  window._method = _method

  // Klip
  if (walletType$.value === "klip") {
    return checkRevert
      ? willRevert$(_method, { from: selectedAddress$.value, to: _contract._address, value })
      : sendAsync$(_method, { from: selectedAddress$.value, to: _contract._address, value })
  }

  // Injected
  if (!window.injected) return of(false)
  if (window.injected && !window.injected.selectedAddress) return of(false)

  return checkRevert
    ? willRevert$(_method, { from: window.injected.selectedAddress, to: _contract._address, value })
    : sendAsync$(_method, { from: window.injected.selectedAddress, to: _contract._address, value })
}

export const multicall = async (abi, calls, getGas) => {
  // const multi = new web3.klay.Contract(MulticallABI, MULTICALL)
  try {
    const multi = new caver.klay.Contract(MulticallABI, MULTICALL)
    const itf = new Interface(abi)

    const _bufferCalls = calls.reduce((acc, cur, idx) => {
      if (cur.except) {
        acc.push({ idx, item: cur })
        return acc
      }

      return acc
    }, [])

    calls = calls.filter((call) => !call.except)

    const calldata = calls
      .map((call) => {
        return [call.address.toLowerCase(), itf.encodeFunctionData(call.name, call.params)]
      })

    const { returnData } = await multi.methods.aggregate(calldata).call()
    const res = returnData.map((call, i) => itf.decodeFunctionResult(calls[i].name, call))

    const result = _bufferCalls.reduce((acc, cur) => {
      return [
        ...acc.slice(0, cur.idx),
        cur.item.format(cur.item.value),
        ...acc.slice(cur.idx)
      ]
    }, res)
 

    // if (getGas) {
    //   const gas = await multi.methods.aggregate(calldata).estimateGas()
    //   return { result: res , gas }
    // }

    return result
  } catch (e) {
    console.log(calls, e, '@e')
    return false
  }
}

// common
export const getTransactionReceipt$ = (txHash) => new Observable((observer) => {
  let count = 0
  const end$ = new Subject()

  interval(500).pipe(
    switchMap(() => from(caver.klay.getTransactionReceipt(txHash))),
    tap((result) => {
      if (result) {
        observer.next(result)
        observer.complete(result)
        end$.next(true)
      } else {
        if (count++ > 10) {
          observer.next(new Error())
          observer.complete(new Error())
        }
      }
    }),
    takeUntil(end$)
  ).subscribe()
})

export const approve$ = (tokenAddress, spender, amount) => {
  if (tokenAddress === tokenList.KLAY.address) {
    tokenAddress = tokenList.WKLAY.address
  }

  return makeTransaction({ abi: IERC20ABI, address: tokenAddress, methodName: "approve", params: [spender, amount] })
}

// Total Token = Total Supply + Total Borrowed
export const listTokenSupplyInfo$ = (lendingPools, debtTokens, account) => {
  
  const nativeCoinBalance = account 
    ? caver.klay.getBalance(account)
    : 0

  const m_totalTokens = multicall(
    VaultABI,
    lendingPools.map(({ vaultAddress }) => ({
      address: vaultAddress,
      // name: 'totalToken',
      name: 'getTotalToken',
      params: [],
    }))
  )

  const m_totalSupplies = multicall(
    VaultABI,
    lendingPools.map(({ vaultAddress }) => ({
      address: vaultAddress,
      name: 'totalSupply',
      params: [],
    }))
  )

  const m_balances = multicall(
    IERC20ABI,
    lendingPools.map(({ stakingToken, stakingTokenInternal, vaultAddress }) => {
      return {
        address: (stakingTokenInternal && stakingTokenInternal.address) || (stakingToken && stakingToken.address),
        name: 'balanceOf',
        params: [vaultAddress],
      }
    })
  )
  
  const m_totalDebtValues = multicall(
    VaultABI,
    lendingPools.map(({ vaultAddress }) => ({
      address: vaultAddress,
      name: 'totalDebtAmount',
      params: [],
    }))
  )

  return forkJoin(m_totalTokens, m_balances, m_totalSupplies, m_totalDebtValues).pipe(
    map(([totalTokens, balances, totalSupplies, totalDebtValues, debtTokenTotalSupplies]) => {
      const coupled = coupleArray({
        arrayA: flatten(totalTokens), 
        labelA: 'totalToken',
        arrayB: flatten(balances),
        labelB: 'balance',
        arrayC: flatten(totalSupplies),
        labelC: 'totalSupply',
        arrayD: flatten(totalDebtValues),
        labelD: 'totalDebtAmount',
      })

      return flatten(coupled).reduce((acc, cur, idx) => {
        const vaultAddress = lendingPools[idx].vaultAddress
        const stakingToken = lendingPools[idx].stakingToken
        const ibToken = lendingPools[idx].ibToken
        const stakingTokenAddress = stakingToken && stakingToken.address
        const stakingTokenDecimals = stakingToken && stakingToken.decimals

        const ibTokenPrice = new BigNumber(cur.totalToken._hex)
          .div(cur.totalSupply._hex)
          .toString()

        acc[vaultAddress] = {

          // totalToken: realToken floating balance + realToken debt balance
          // totalSupply: ibToken balance

          // depositedTokenBalance: new BigNumber(cur.totalSupply._hex).div(10 ** stakingTokenDecimals).toString(),
          
          // Deposited real token balance

          depositedTokenBalance: new BigNumber(cur.totalToken._hex)
            .div(10 ** stakingTokenDecimals)
            .toString(),
          
          totalSupplyPure: new BigNumber(cur.totalToken._hex).toString(),
          
          // totalBorrowedPure: new BigNumber(cur.totalToken._hex)
          //   .minus(cur.balance._hex)
          //   .toString(),
          // totalBorrowed: new BigNumber(cur.totalToken._hex)
          //   .minus(cur.balance._hex)
          //   .div(10 ** stakingTokenDecimals)
          //   .toString(),

          totalBorrowedPure: new BigNumber(cur.totalDebtAmount._hex)
            .toString(),
          totalBorrowed: new BigNumber(cur.totalDebtAmount._hex)
            .div(10 ** stakingTokenDecimals)
            .toString(),

          totalSupply: new BigNumber(cur.totalToken._hex)
            .div(10 ** stakingTokenDecimals)
            .toString(),
          totalUnborrowed: new BigNumber(cur.balance._hex)
            .div(10 ** stakingTokenDecimals)
            .toString(),
          ibToken: ibToken,
          ibTokenPrice: ibTokenPrice === "NaN" 
            ? 1
            : ibTokenPrice,
        }

        return acc
      }, {})
    }),
    switchMap((totalInfo) => {

      const m_borrowingIntrests = multicall(
        VaultConfigABI,
        lendingPools.map(({ vaultAddress, vaultConfigAddress }) => {
          const info = totalInfo[vaultAddress]
          return {
            address: vaultConfigAddress,
            name: 'calcInterestRate',
            params: [
                info.totalBorrowedPure, 
                new BigNumber(info.totalSupplyPure)
                .minus(info.totalBorrowedPure)
                .toString()
            ],
          }
        })
      )

      // debt token supplies calc
      const _debtTokens = Object.entries(debtTokens).map(([ibTokenAddress, val]) => {
        return {
          ibTokenAddress,
          ...val,
        }
      })

      const m_debtTokenTotalSupplies = multicall(
        IERC20ABI,
        _debtTokens.map(({ address }) => ({
          address,
          name: 'totalSupply',
          params: [],
        }))
      )
      

      return forkJoin(
          from(m_borrowingIntrests),
          from(m_debtTokenTotalSupplies),
        ).pipe(
          map(([_borrowingInterests, _debtTokenTotalSupplies, _prevUtilizationRates]) => {
            const borrowingInterests = flatten(_borrowingInterests).reduce((acc, cur) => {
              acc.push(new BigNumber(cur._hex).toString())
              return acc
            }, [])

            const debtTokenTotalSupplies = flatten(_debtTokenTotalSupplies).reduce((acc, cur) => {
              acc.push(new BigNumber(cur._hex).toString())
              return acc
            }, [])

            return Object.entries(totalInfo).reduce((acc, [vaultAddress, item], idx) => {  
              const _borrowingInterest = new BigNumber(borrowingInterests[idx])
                .multipliedBy(60 * 60 * 24 * 365)
                .div(10 ** 18)
                .multipliedBy(100)
                .toNumber()

              acc[vaultAddress] = {
                ...item,
                borrowingInterest: _borrowingInterest,
              }

              const debtTokenInfo = _debtTokens[idx]

              const ibToken = addressKeyFind(ibTokenByAddress, vaultAddress)
              const originalToken = getOriginalTokenFromIbToken(ibToken)

              const _debtTokenTotalSupply = new BigNumber(debtTokenTotalSupplies[idx])
                .toString()

              acc[item.ibToken.originalToken.address] = { 
                borrowingInterest: _borrowingInterest, 
                debtTokenTotalSupply: _debtTokenTotalSupply,
                debtTokenInfo,

                ibTokenPrice: item.ibTokenPrice,
                ibToken,
                originalToken,
              }
              acc[item.ibToken.originalToken.address.toLowerCase()] = { 
                borrowingInterest: _borrowingInterest,
                debtTokenTotalSupply: _debtTokenTotalSupply,
                debtTokenInfo,

                ibTokenPrice: item.ibTokenPrice,
                ibToken,
                originalToken,
              }

              return acc
            }, {})
          })
      )
    })
  )
}

// export const getDebtTokenTotalSuplies$ = (debtTokens) => {

//   const debtTokensArr = Object.entries(debtTokens)

//   const m_debtTokenTotalSupplies = multicall(
//     IERC20ABI,
//     Object.entries(debtTokens).map(([address, _]) => ({
//       address: address,
//       name: 'totalSupply',
//       params: [],
//     }))
//   )

//   return from(m_debtTokenTotalSupplies).pipe(
//     map((totalSupplies) => {
//       return flatten(totalSupplies).reduce((acc, cur) => {
//         totalSupplies
//       }, {})
//     })
//   )
// }

export const balanceOfMultiInWallet$ = (account, tokenAddresses) => {
  const p0 = caver.klay.getBalance(account)

  // Balances in Wallet
  const p1 = multicall(
    IERC20ABI,
    tokenAddresses.map(({ address }) => {
      return { address, name: 'balanceOf', params: [account] }
    })
  )

  return forkJoin(
    from(p0),
    from(p1).pipe(
      map((balancesInWallet) => {
        
        const balancesInWalletParsed = flatten(balancesInWallet).map(({ _hex }, idx) => {
          const token = tokenAddresses[idx]

          return {
            balancePure: new BigNumber(_hex).toString(),
            balanceParsed: new BigNumber(_hex).dividedBy(10 ** (token && token.decimals)).toString(),
          }
        })

        return balancesInWalletParsed.reduce((acc, cur, idx) => {
          acc[tokenAddresses[idx].address] = cur
          return acc
        }, {})
      })
    )
  ).pipe(
    map(([
      klayBalance, 
      // bnbBalance,
      balances
    ]) => {

      const klayBal = {
        balancePure: klayBalance,
        balanceParsed: new BigNumber(klayBalance).div(10 ** 18).toString(),
      }
      
      // const bnbBal = {
      //   balancePure: bnbBalance,
      //   balanceParsed: new BigNumber(bnbBalance).div(10 ** 18).toString(),
      // }

      return {
        ...balances,
        "0x0000000000000000000000000000000000000000": klayBal,
        "KLAY": klayBal,
        // "0x0000000000000000000000000000000000000000": bnbBal,
        // "BNB": bnbBal,
      }
    })
  )
}

// Fairlaucnch contract
export const balanceOfMultiInStakingPool$ = (account, stakingPoolList) => {
  // Balances in staking pool(FairLaunch Pool)
  const p2 = multicall(
    FairLaunchABI,
    stakingPoolList.map(({ pid }) => {
      // console.log(pid, "pid", account, "account")
      // return { address: FAIRLAUNCH, name: 'userInfo', params: [pid, account] }
      return { address: FAIRLAUNCH, name: 'userInfos', params: [pid, account] }
    })
  )

  return from(p2).pipe(
    map((balancesInStaking) => {
      balancesInStaking = balancesInStaking.reduce((acc, cur, idx) => {
        acc.push(cur.amount)
        return acc
      }, [])

      const balancesInStakingParsed = flatten(balancesInStaking).map(({ _hex }, idx) => {
        const pool = stakingPoolList[idx]
        const token = pool && pool.stakingToken

        return {
          balancePure: new BigNumber(_hex).toString(),
          balanceParsed: new BigNumber(_hex).dividedBy(10 ** (token && token.decimals)).toString(),
        }
      })

      return balancesInStakingParsed.reduce((acc, cur, idx) => {
        acc[stakingPoolList[idx] && stakingPoolList[idx].vaultAddress] = cur
        return acc
      }, {})
    })
  )
}

export const depositForLending$ = (vaultAddress, tokenAmount, nativeCoinAmount = 0) => {
  
  if (walletType$.value === 'klip' && (nativeCoinAmount === tokenAmount)) {
    const valueSplitted = String(nativeCoinAmount / 10 ** 18).split('.')

    let valueDecimalPoint = valueSplitted && valueSplitted[1]

    if (valueDecimalPoint && valueDecimalPoint.length > 6) {

      nativeCoinAmount = new BigNumber(`${valueSplitted[0]}.${valueDecimalPoint.slice(0, 6)}`)
        .multipliedBy(10 ** 18)
        .toString()

      tokenAmount = new BigNumber(`${valueSplitted[0]}.${valueDecimalPoint.slice(0, 6)}`)
        .multipliedBy(10 ** 18)
        .toString()

    }
  }

  return makeTransaction({
    abi: VaultABI,
    address: vaultAddress,
    methodName: "deposit",
    params: [tokenAmount],
    value: nativeCoinAmount,
  })
}

export const withdrawFromLending$ = (vaultAddress, tokenAmount = 0) => {

  return makeTransaction({
    abi: VaultABI,
    address: vaultAddress,
    methodName: "withdraw",
    params: [tokenAmount],
    value: 0,
  })
}

export const stakeToStakingPool$ = (account, pid, amount) => {

  return makeTransaction({
    abi: FairLaunchABI,
    address: FAIRLAUNCH,
    // methodName: "deposit",
    methodName: "depositToPool",
    params: [account, pid, amount],
    value: 0,
  })
}

export const unstakeFromStakingPool$ = (account, pid, amount) => {

  return makeTransaction({
    abi: FairLaunchABI,
    address: FAIRLAUNCH,
    // methodName: "withdraw",
    methodName: "withdrawFromPool",
    params: [account, pid, amount],
    value: 0,
  })
}

export const harvestFromStakingPool$ = (pid) => {

  return makeTransaction({
    abi: FairLaunchABI,
    address: FAIRLAUNCH,
    methodName: "harvest",
    params: [pid],
    value: 0,
  })
}

// Farming
export const getPendingGTInFairlaunchPool$ = (fairLaunchPoolList, account) => {
  const callName = 'calcPendingReward'

  const p1 = multicall(
    FairLaunchABI,
    fairLaunchPoolList.map(({ pid }) => {
      return { address: FAIRLAUNCH, name: callName, params: [pid, account] }
    })
  )

  return from(p1).pipe(
    map((pendingGTList) => {
      return showParamsOnCall(pendingGTList, ['pendingReward']).reduce((acc, cur, idx) => {
        const _fairLaunchPool = fairLaunchPoolList[idx]
        acc[_fairLaunchPool.pid] = new BigNumber(cur.pendingReward).toString()
        return acc
      }, {})
    })
  )
}

export const getPendingGTInDebtTokenPool$ = (debtTokenList, account) => {
  const callName = 'calcPendingReward'

  const p1 = multicall(
    FairLaunchABI,
    debtTokenList.map(({ pid }) => {
      return { address: FAIRLAUNCH, name: callName, params: [pid, account] }
    })
  )

  return from(p1).pipe(
    map((pendingGTList) => {
      return showParamsOnCall(pendingGTList, ['pendingReward']).reduce((acc, cur, idx) => {
        const _debtTokenPool = debtTokenList[idx]
        acc[_debtTokenPool.pid] = new BigNumber(cur.pendingReward).toString()
        return acc
      }, {})
    })
  )
}

export const allowancesMultiInLendingPool$ = (account, lendingPools) => {

  const p1 = multicall(
    IERC20ABI,
    lendingPools.map(({ stakingToken, stakingTokenInternal, vaultAddress }, idx) => {
      return { address: (stakingTokenInternal?.address || stakingToken?.address), name: 'allowance', params: [account, vaultAddress] }
    })
  )

  return from(p1).pipe(
    map((allowances) => {
      return flatten(allowances).reduce((acc, cur, idx) => {
        const vaultAddress = lendingPools[idx] && lendingPools[idx].vaultAddress
        acc[vaultAddress] = new BigNumber(cur._hex).toString()

        return acc
      }, {})
    })
  )
}

export const allowancesMultiInStakingPool$ = (account, stakingPools) => {

  const p1 = multicall(
    IERC20ABI,
    stakingPools.map(({ stakingToken }, idx) => {
      return { address: stakingToken && stakingToken.address, name: 'allowance', params: [account, FAIRLAUNCH] }
    })
  )

  return from(p1).pipe(
    map((allowances) => {
      return flatten(allowances).reduce((acc, cur, idx) => {
        // const vaultAddress = stakingPools[idx] && stakingPools[idx].vaultAddress
        const stakingToken = stakingPools[idx] && stakingPools[idx].stakingToken
        acc[stakingToken.address] = new BigNumber(cur._hex).toString()

        return acc
      }, {})
    })
  )
}

export const getPositionInfo$ = (positionList) => {

  const positionListByExchange = {
    klayswap: [],
    kokonutswap: [],
    ...groupBy(positionList, 'exchange'),
  }

  const p1 = multicall(
    KlayswapCalculatorABI,
    positionListByExchange?.klayswap.map(({ exchange, vaultAddress, workerAddress, positionId }) => {
      return { address: KLAYSWAP_CALCULATOR, name: 'getPositionInfo', params: [workerAddress, positionId] }
    })
  )

  const p2 = multicall(
    KlayswapCalculatorABI,
    positionListByExchange?.klayswap.map(({ exchange, vaultAddress, workerAddress, positionId }) => {
      return { address: KLAYSWAP_CALCULATOR, name: 'getLpIngridients', params: [workerAddress, positionId] }
    })
  )
  
  const p1_kokonut = multicall(
    KokonutswapCalculatorABI,
    positionListByExchange?.kokonutswap.map(({ exchange, vaultAddress, workerAddress, positionId }) => {
      return { address: KOKONUTSWAP_CALCULATOR, name: 'getPositionInfo', params: [workerAddress, positionId] }
    })
  )

  const p2_kokonut = multicall(
    KokonutswapCalculatorABI,
    positionListByExchange?.kokonutswap.map(({ exchange, vaultAddress, workerAddress, positionId }) => {
      return { address: KOKONUTSWAP_CALCULATOR, name: 'getLpIngridients', params: [workerAddress, positionId, false] }
    })
  )

  return forkJoin([
    p1, 
    p2,
    p1_kokonut,
    p2_kokonut,
  ]).pipe(
    map(([
      positionInfoList, 
      ingredientsList,
      positionInfoList_kokonut, 
      ingredientsList_kokonut,
    ]) => {

      const klayswapPositionResult = showParamsOnCall(positionInfoList, ['positionValue', 'health', 'debtAmt']).reduce((acc, cur, idx) => {

        const _position = positionListByExchange?.klayswap[idx]

        acc[_position.id] = acc[_position.id] || { ..._position }
        acc[_position.id]['positionValue'] = cur.positionValue
        acc[_position.id]['health'] = cur.health
        acc[_position.id]['debtValue'] = cur.debtAmt

        acc[_position.id]['baseAmt'] = new BigNumber(ingredientsList[idx].baseAmt._hex).toString()
        acc[_position.id]['farmAmt'] = new BigNumber(ingredientsList[idx].farmAmt._hex).toString()
        
        return acc
      }, {})

      const kokonutPositionResult = showParamsOnCall(positionInfoList_kokonut, ['positionValue', 'health', 'debtAmt', 'lpBalance']).reduce((acc, cur, idx) => {

        const _position = positionListByExchange?.kokonutswap[idx]

        const _ingredientsList = flatten(ingredientsList_kokonut[idx])

        acc[_position.id] = acc[_position.id] || { ..._position }
        acc[_position.id]['positionValue'] = cur.positionValue
        acc[_position.id]['health'] = cur.health
        acc[_position.id]['debtValue'] = cur.debtAmt
        acc[_position.id]['lpBalance'] = cur.lpBalance

        // parsed values
        acc[_position.id]['token1Amt'] = new BigNumber(_ingredientsList[0]._hex)
          .div(10 ** _position.token1?.decimals || 0)
          .toString()
        acc[_position.id]['token2Amt'] = new BigNumber(_ingredientsList[1]._hex)
          .div(10 ** _position.token2?.decimals || 0)
          .toString()
        acc[_position.id]['token3Amt'] = new BigNumber(_ingredientsList[2]?._hex || 0)
          .div(10 ** _position.token3?.decimals || 0)
          .toString()
        acc[_position.id]['token4Amt'] = new BigNumber(_ingredientsList[3]?._hex || 0)
          .div(10 ** _position.token4?.decimals || 0)
          .toString()

        return acc
      }, {})

      return {
        ...klayswapPositionResult,
        ...kokonutPositionResult,
      }
    }),
    map((positionInfoMap) => {
      return Object.entries(positionInfoMap)
        .reduce((acc, [positionId, item]) => {
          acc.push(item)
          return acc
        }, [])
        .sort((a, b) => Number(b.positionId) - Number(a.positionId))
    })
  )
}

export const getPositionInfo_single$ = ({ workerAddress, positionId }) => {
  return call$({
    abi: KlayswapCalculatorABI,
    address: KLAYSWAP_CALCULATOR,
    methodName: "getPositionInfo",
    params: [
      workerAddress,
      positionId,
    ]
  })
}

export const getWorkerInfo$ = (workerList, ownerAddress) => {

  // KillFactorBPS
  const p1 = multicall(
    KlayswapWorkerABI,
    workerList.map(({ workerAddress, id }) => {
      return { address: workerAddress, name: 'killFactorBps', params: [ownerAddress || "0x" + "0".repeat(40)] }
    })
  )
  
  const p2 = multicall(
    KlayswapWorkerABI,
    workerList.map(({ workerAddress, id }) => {
      return { address: workerAddress, name: 'workFactorBps', params: [ownerAddress || "0x" + "0".repeat(40)] }
    })
  )

  const p3 = multicall(
    KlayswapWorkerABI,
    workerList.map(({ workerAddress, id }) => {
      return { address: workerAddress, name: 'lpPoolId', params: [] }
    })
  )

  const p4 = multicall(
    KlayswapWorkerABI,
    workerList.map(({ workerAddress, id }) => {
      return { address: workerAddress, name: 'rawKillFactorBps', params: [ownerAddress || "0x" + "0".repeat(40)] }
    })
  )
  
  const p5 = multicall(
    KlayswapWorkerABI,
    workerList.map(({ workerAddress, id }) => {
      return { address: workerAddress, name: 'totalShare', params: [] }
    })
  )
  
  const p6 = multicall(
    KlayswapWorkerABI,
    workerList.map(({ workerAddress, id }) => {
      return { address: workerAddress, name: 'totalStakedLpBalance', params: [] }
    })
  )

  const p7 = multicall(
    KlayswapCalculatorABI,
    workerList.map((worker) => {
      const { workerAddress } = worker
      return { 
        address: KLAYSWAP_CALCULATOR, 
        name: 'membershipInfo', 
        params: [
          workerAddress,
          ownerAddress || "0x" + "0".repeat(40),
        ]
      }
    })
  )

  return forkJoin([p1, p2, p3, p4, p5, p6, p7]).pipe(
    map(([
      killFactorBpsList, 
      workFactorBpsList, 
      lpPoolIdList, 
      rawKillFactorBpsList,
      totalShareList,
      totalStakedLpBalanceList,
      membershipInfoList,
    ]) => {

      const coupled = coupleArray({
        arrayA: flatten(killFactorBpsList),
        labelA: 'killFactorBps',
        arrayB: flatten(workFactorBpsList),
        labelB: 'workFactorBps',
        arrayC: flatten(lpPoolIdList),
        labelC: 'lpPoolId',
        arrayD: flatten(rawKillFactorBpsList),
        labelD: 'rawKillFactorBps',
        arrayE: flatten(totalShareList),
        labelE: 'totalShare',
        arrayF: flatten(totalStakedLpBalanceList),
        labelF: 'totalStakedLpBalance',
        arrayG: membershipInfoList,
        labelG: 'membershipInfo',
      })

      return flatten(coupled).reduce((acc, cur, idx) => {
        const _worker = workerList[idx]
        const workerAddress = _worker && _worker.workerAddress
        const membershipInfo = cur.membershipInfo

        acc[workerAddress] = {
          // Deposited real token balance
          ..._worker,
          lpToken: lpTokenByIngredients(
            _worker.tokens || [_worker.farmingToken, _worker.baseToken]
          ),
          // killFactorBps: new BigNumber(cur.killFactorBps._hex).toString(),
          // workFactorBps: new BigNumber(cur.workFactorBps._hex).toString(),
          killFactorBps: new BigNumber(membershipInfo.killFactorBps._hex).toString(),
          workFactorBps: new BigNumber(membershipInfo.workFactorBps._hex).toString(),
          rawKillFactorBps: new BigNumber(cur.rawKillFactorBps._hex).toString(),
          lpPoolId: new BigNumber(cur.lpPoolId._hex).toString(),
          totalShare: new BigNumber(cur.totalShare._hex).toString(),
          totalStakedLpBalance: new BigNumber(cur.totalStakedLpBalance._hex).toString(),

          isMembershipUser: membershipInfo.isMembershipUser,
          membershipKillFactorBps: new BigNumber(membershipInfo.membershipKillFactorBps._hex).toString(),
          membershipWorkFactorBps: new BigNumber(membershipInfo.membershipWorkFactorBps._hex).toString(),

          liquidatePrizeBps: new BigNumber(membershipInfo.liquidatePrizeBps._hex).toString(),
          membershipLiquidatePrizeBps: new BigNumber(membershipInfo.membershipLiquidatePrizeBps._hex).toString(),
          killTreasuryBps: new BigNumber(membershipInfo.killTreasuryBps._hex).toString(),
          membershipKillTreasuryBps: new BigNumber(membershipInfo.membershipKillTreasuryBps._hex).toString(),
        }

        return acc
      }, {})
    })
  )
}

export const call$ = ({ abi, address, methodName, params }) => {
  const _contract = new caver.klay.Contract(abi, address)
  const _method = _contract.methods[methodName](...params)

  try {
    return from(_method.call())
  } catch (e) {
    console.log(e, '*error')
    return from(0)
  }
}

// Contract

export const getOutputAmount$ = (lpTokenAddress, inputTokenAddress, inputTokenAmount) => {
  return call$({ abi: KlayswapExchangeABI, address: lpTokenAddress, methodName: 'estimatePos', params: [inputTokenAddress, inputTokenAmount] })
}

export const getInputAmount$ = (lpTokenAddress, outputTokenAddress, outputTokenAmount) => {
  return call$({ abi: KlayswapExchangeABI, address: lpTokenAddress, methodName: 'estimateNeg', params: [outputTokenAddress, outputTokenAmount] })
}

export const getCurrentPool$ = (lpTokenAddress) => {
  return call$({ abi: KlayswapExchangeABI, address: lpTokenAddress, methodName: 'getCurrentPool', params: [] })
}

export const getPoolReserves$ = (lpTokenList) => {
  
  const p1 = multicall(
    KlayswapExchangeABI,
    lpTokenList.map(({ address }) => {
      return { address, name: 'getCurrentPool', params: [] }
    })
  )
  
  const p2 = multicall(
    KlayswapExchangeABI,
    lpTokenList.map(({ address }) => {
      return { address, name: 'totalSupply', params: [] }
    })
  )
  
  const p3 = multicall(
    KlayswapExchangeABI,
    lpTokenList.map(({ address }) => {
      return { address, name: 'tokenA', params: [] }
    })
  )

  return forkJoin(
    from(p1),
    from(p2),
    from(p3),
  ).pipe(
    map(([_reserves, _lpTotalSupplies, _tokenAList]) => {

      const tokenAList = _tokenAList.reduce((acc, cur) => {
        if (cur.tokenA._hex == "0x00") {
          acc.push("0x" + "0".repeat(40))
          return acc
        }

        acc.push(cur.tokenA._hex)
        return acc
      }, [])

      const lpTotalSupplies = showParamsOnCall(_lpTotalSupplies, ['totalSupply'])
      const reserves = showParamsOnCall(_reserves, ['reserveA', 'reserveB'])

      return reserves.reduce((acc, cur, idx) => {
        // const lpToken = lpTokenList[parseInt(idx / 2)]
        const lpToken = lpTokenList[idx]
        
        const _tokenA = tokenAList[idx]

        const tokenA = (_tokenA.toLowerCase() == lpToken?.ingredients[0].address.toLowerCase()) 
          ? lpToken?.ingredients[0]
          : lpToken?.ingredients[1]

        const tokenB = (_tokenA.toLowerCase() == lpToken?.ingredients[0].address.toLowerCase()) 
          ? lpToken?.ingredients[1]
          : lpToken?.ingredients[0]

        acc[lpToken.address] = acc[lpToken.address] || {}

        acc[lpToken.address] = {
          title: lpToken?.title,
          ...acc[lpToken.address],
          [tokenA.address]: new BigNumber(cur.reserveA).toString(),
          [tokenB.address]: new BigNumber(cur.reserveB).toString(),
          totalSupply: lpTotalSupplies[idx]?.totalSupply,
          decimals: lpToken?.decimals
        }

        // Cover lowercase key
        acc[lpToken.address.toLowerCase()] = acc[lpToken.address]

        return acc
      }, {})
    })
  )
}

// alloc point
export const getKlevaAnnualReward$ = (fairLaunchPoolList) => {

  const stakingPoolOnly = fairLaunchPoolList.filter(({ vaultAddress }) => !!vaultAddress)

  const p1 = multicall(
    FairLaunchABI,
    fairLaunchPoolList.map(({ pid }) => {
      return { address: FAIRLAUNCH, name: 'poolInfos', params: [pid] }
    })
  )

  const p2 = call$({ abi: FairLaunchABI, address: FAIRLAUNCH, methodName: 'getRewardPerBlock', params: [] })
  const p3 = call$({ abi: FairLaunchABI, address: FAIRLAUNCH, methodName: 'getTotalAllocPoint', params: [] })

  // prevUtlizationRates

  const p4 = multicall(
    VaultABI,
    stakingPoolOnly.map(({ vaultAddress }) => {
      return { address: vaultAddress, name: 'getPrevUtilizationRates', params: [] }
    })
  )

  return forkJoin(
    from(p1),
    from(p2),
    from(p3),
    from(p4),
  ).pipe(
    map(([_poolInfos, rewardPerBlock, totalAllocPoint, _prevUtilizationRates]) => {
      const poolInfos = showParamsOnCall(_poolInfos, ['vaultToken', 'allocPoint', 'lastRewardBlockNumber', 'accRewardPerShare', 'isRealVault'])
      
      // Utilization Rates (Conditional Release)
      const utilizationRatesInfoList = showParamsOnCall(_prevUtilizationRates, ['crLowerLimitBps', 'ur0', 'ur1', 'ur2'])
      const utilizationRatesMap = stakingPoolOnly.reduce((acc, { pid }, idx) => {
        acc[pid] = utilizationRatesInfoList[idx]
        return acc
      }, {})

      return poolInfos.reduce((acc, cur, idx) => {
        const pool = fairLaunchPoolList[idx]
        
        const utilizationRateInfo = utilizationRatesMap[pool.pid]

        const utilizationMultiplyFactor = new BigNumber(utilizationRateInfo?.ur1).lt(utilizationRateInfo?.ur2)
          ? Math.min(new BigNumber(utilizationRateInfo?.ur1).div(utilizationRateInfo?.ur2).toNumber(), 0.7)
          : 1

        acc[pool.pid] = new BigNumber(rewardPerBlock)
          .multipliedBy(86400 * 365) // 1 year
          .div(10 ** tokenList.KLEVA.decimals)
          .multipliedBy(cur.allocPoint)
          .div(totalAllocPoint)
          .multipliedBy(utilizationMultiplyFactor)
          .toString()

        return acc
      }, {})
    })
  )
}

export const checkAllowances$ = (account, targetContractAddress, tokens) => {
  const filteredTokens = tokens
    .map((_token) => {
      if (_token.address === tokenList.KLAY.address) {
        return tokenList.WKLAY
      }

      return _token
    })

  const p1 = multicall(
    IERC20ABI,
    filteredTokens.map(({ address }) => {
      return { address, name: 'allowance', params: [account, targetContractAddress] }
    })
  )

  return from(p1).pipe(
    map((allowances) => {
      return flatten(allowances).reduce((acc, cur, idx) => {
        const tokenAddress = filteredTokens[idx] && filteredTokens[idx].address
        acc[tokenAddress] = new BigNumber(cur._hex).toString()

        return acc
      }, {})
    })
  )
}

export const getPoolAmountOfStakingPool$ = (stakingPools) => {
  const p1 = multicall(
    IERC20ABI,
    stakingPools.map(({ stakingToken }, idx) => {
      return { address: stakingToken && stakingToken.address, name: 'balanceOf', params: [FAIRLAUNCH] }
    })
  )
  
  return from(p1).pipe(
    map((poolAmounts) => {
      return showParamsOnCall(poolAmounts, ['poolAmount']).reduce((acc, cur, idx) => {
        const stakingPool = stakingPools[idx]
        const stakingToken = stakingPool && stakingPool.stakingToken
        
        acc[stakingPool.pid] = new BigNumber(cur.poolAmount).div(10 ** stakingToken.decimals).toString()

        return acc
      }, {})
    })
  )
}

export const getFarmDeposited$ = (farmPools, workerInfoMap, tokenPrices) => {

  const multicallArray = flatten(farmPools.reduce((acc, cur, farmIdx) => {

    const feedForMulticall = cur.workerList.map(({ workerAddress, exchange }, workerIdx) => {
      const workerInfo = workerInfoMap[workerAddress]

      return { 
        address: FAIRLAUNCH, 
        name: 'userInfos', 
        params: [workerInfo.lpPoolId, workerAddress],
        info: { 
          farmIdx: farmIdx, 
          farm: cur,
          workerInfo,
          lpToken: lpTokenByIngredients(cur.token1, cur.token2, cur.token3, cur.token4)
        }
      }
    })

    acc.push(feedForMulticall)

    return acc

  }, []))

  const p1 = multicall(
    FairLaunchABI,
    multicallArray
  )

  return from(p1).pipe(
    map((workerLPAmountList) => {
      return showParamsOnCall(workerLPAmountList, ['amount', 'rewardDebt', 'fundedBy']).reduce((acc, cur, idx) => {
      

        const multicallArrayItem = multicallArray[idx]

        const workerInfo = multicallArrayItem.info.workerInfo

        const lpTokenPrice = tokenPrices[multicallArrayItem.info.lpToken.address.toLowerCase()]

        const _deposited = workerInfo.exchange === 'kokonutswap' 
          ? new BigNumber(workerInfo.totalStakedLpBalance)
            .div(10 ** multicallArrayItem.info.lpToken.decimals)
            .multipliedBy(lpTokenPrice)
            .toNumber()
          : new BigNumber(cur.amount || 0)
            .div(10 ** multicallArrayItem.info.lpToken.decimals)
            .multipliedBy(lpTokenPrice)
            .toNumber()

        acc.byPid[multicallArrayItem.info.farmIdx] = {

          deposited: new BigNumber(acc.byPid[multicallArrayItem.info.farmIdx] && acc.byPid[multicallArrayItem.info.farmIdx].deposited || 0)
              .plus(_deposited)
              .toNumber(),

            lpToken: multicallArrayItem.info.lpToken,
        }

        acc.byAddress[multicallArrayItem.info.lpToken.address.toLowerCase()] = acc.byPid[multicallArrayItem.info.farmIdx]

        return acc
      }, {
        byAddress: {},
        byPid: {},
      })
    })
  )
}

// WKLAY
export const wrapKLAY$ = (amount) => makeTransaction({ 
  abi: WKLAYABI,
  address: tokenList.WKLAY.address,
  methodName: 'deposit',
  params: [],
  value: amount,
})

export const unwrapWKLAY$ = (amount) => makeTransaction({ 
  abi: WKLAYABI,
  address: tokenList.WKLAY.address,
  methodName: 'withdraw',
  params: [amount],
  value: 0,
})

// Adjust Position

// add collateral
export const addCollateral$ = (vaultAddress, { positionId, principalAmount, data, value, poolType }) => {
  if (poolType === "K4POOL") {
    return makeTransaction({
      abi: VaultABI,
      address: vaultAddress,
      methodName: "editPosition",
      params: [
        positionId, 
        principalAmount, 
        0,
        0,
        data
      ],
      value,
    })
  }

  return makeTransaction({
    abi: VaultABI,
    address: vaultAddress,
    methodName: "addCollateral",
    params: [positionId, principalAmount, data],
    value,
  })
}

export const addPosition$ = (vaultAddress, {
  workerAddress,
  principalAmount,
  borrowAmount,
  maxReturn,
  data,
  value = 0,
}) => {

  return makeTransaction({
    abi: VaultABI,
    address: vaultAddress,
    methodName: "addPosition",
    params: [workerAddress, principalAmount, borrowAmount, maxReturn, data],
    value,
  })
}

export const convertToBaseToken$ = (vaultAddress, { positionId, data }) => {
  return makeTransaction({
    abi: VaultABI,
    address: vaultAddress,
    methodName: "editPosition",
    params: [positionId, 0, 0, MAX_UINT, data],
  })
}

export const minimizeTrading$ = (vaultAddress, { positionId, data }) => {

  return makeTransaction({
    abi: VaultABI,
    address: vaultAddress,
    methodName: "editPosition",
    params: [positionId, 0, 0, MAX_UINT, data]
  })
}

// add collateral & borrow
export const borrowMore$ = (vaultAddress, { positionId, debtAmount, data }) => {

  return makeTransaction({
    abi: VaultABI,
    address: vaultAddress,
    methodName: "editPosition",
    params: [positionId, 0, debtAmount, 0, data]
  })
}

export const partialCloseLiquidate$ = (vaultAddress, { positionId, maxDebtRepayment, data }) => {
  /*
    abi.encode(
      KlayswapPartialLiquidateStrategy_address, 
      abi.encode(maxLpTokenToLiquidate, maxDebtRepayment, minBaseTokenAmount)
    )
  */
  return makeTransaction({
    abi: VaultABI,
    address: vaultAddress,
    methodName: "editPosition",
    params: [positionId, 0, 0, maxDebtRepayment, data]
  })
}

export const partialMinimizeTrading$ = (vaultAddress, { positionId, maxDebtRepayment, data }) => {
  return makeTransaction({
    abi: VaultABI,
    address: vaultAddress,
    methodName: "editPosition",
    params: [positionId, 0, 0, maxDebtRepayment, data]
  })
}

export const health$ = (workerAddress, { positionId }) => {
  return call$({ 
    abi: KlayswapWorkerABI,
    methodName: 'health', 
    address: workerAddress, 
    params: [positionId],
  })
}

// Unlock
export const calcUnlockableAmount$ = (account) => call$({
  abi: KLEVATokenABI,
  methodName: 'calcUnlockableAmount',
  address: tokenList.KLEVA.address,
  params: [account],
})

export const lockOf$ = (account) => call$({
  abi: KLEVATokenABI,
  methodName: 'lockOf',
  address: tokenList.KLEVA.address,
  params: [account],
})

export const unlock$ = () => makeTransaction({
  abi: KLEVATokenABI,
  address: tokenList.KLEVA.address,
  methodName: "unlock",
  params: []
})

// Utilization

export const getPrevUtilizationRatio$ = () => {
  
}

// Klayswap APR
const KSP_DAY_DISTRIBUTION = 86400
export const getYearlyKSP$ = (klayswapFarmList) => {
  const p = multicall(
    KlayswapMiningABI,
    klayswapFarmList.map(({ lpToken }) => {
      return { address: lpToken.address, name: 'mining', params: [] }
    })
  )

  return from(p).pipe(
    map((_miningRateList) => {

      return showParamsOnCall(_miningRateList, ['miningRate']).reduce((acc, cur, idx) => {
        acc[klayswapFarmList[idx]?.lpToken?.address] = new BigNumber(cur.miningRate)
          .div(10 ** 18)
          .multipliedBy(KSP_DAY_DISTRIBUTION)
          .multipliedBy(365)
          .toNumber()

        return acc
      }, {})
    })
  )
}

// klayswap calculator
export const getOpenPositionResult$ = ({
  workerAddress,
  leveragedBaseTokenAmount,
  farmTokenAmount,
  positionId,
}) => {

  return call$({
    abi: KlayswapCalculatorABI,
    address: KLAYSWAP_CALCULATOR,
    methodName: "getOpenPositionResult",
    params: [
      workerAddress,
      leveragedBaseTokenAmount,
      farmTokenAmount,
      positionId,
    ]
  }).pipe(
    catchError(() => {
      return of({
        priceImpactBps: "0",
        resultBaseTokenAmount: "0",
        resultFarmTokenAmount: "0",
        swapedBaseTokenAmount: "0",
        swapedFarmTokenAmount: "0",
      })
    })
  )
}

export const getCloseBaseOnlyResult$ = ({
  workerAddress,
  positionId
}) => {

  return call$({
    abi: KlayswapCalculatorABI,
    address: KLAYSWAP_CALCULATOR,
    methodName: "getCloseBaseOnlyResult",
    params: [
      workerAddress,
      positionId,
    ]
  }).pipe(
    switchMap(({
      receiveBaseTokenAmt,
      amountToTrade,
    }) => {

      const worker = workerByAddress[workerAddress]

      return getDexSelling$({
        tokenIn: worker.farmingToken.address,
        tokenInAmount: amountToTrade,
        tokenOut: worker.baseToken.address,
      }).pipe(
        map(({
          tokenOutAmount,
          priceImpactBps,
          priceImpactBpsWithoutFee,
        }) => {
          return {
            receiveBaseTokenAmt,
            amountToTrade,
            tokenOutAmount,
            priceImpactBps,
            priceImpactBpsWithoutFee,
          }
        })
      )
    }),
    catchError(() => {
      return of({
        error: true,
        receiveBaseTokenAmt: 0,
        amountToTrade: 0,
        tokenOutAmount: 0,
        priceImpactBps: 0,
        priceImpactBpsWithoutFee: 0,
      })
    })
  )
}

export const getCloseBaseOnlyResult_kokonut$ = ({
  workerAddress,
  positionId
}) => {

  return call$({
    abi: KokonutswapCalculatorABI,
    address: KOKONUTSWAP_CALCULATOR,
    methodName: "getCloseBaseOnlyResult",
    params: [
      workerAddress,
      positionId,
    ]
  }).pipe(
    catchError(() => {
      return of({
        error: true,
        receiveBaseTokenAmt: 0,
      })
    })
  )
}

export const getCloseMinimizeResult$ = ({
  workerAddress,
  positionId
}) => {

return call$({
    abi: KlayswapCalculatorABI,
    address: KLAYSWAP_CALCULATOR,
    methodName: "getCloseMinimizeResult",
    params: [
      workerAddress,
      positionId,
    ]
  }).pipe(
    switchMap(({
      amountToTrade,
      receiveBaseTokenAmt,
      receiveFarmTokenAmt,
    }) => {

      let worker = workerByAddress[workerAddress]

      return getDexSelling$({
        tokenIn: worker.farmingToken.address,
        tokenInAmount: amountToTrade,
        tokenOut: worker.baseToken.address,
      }).pipe(
        map(({
          tokenOutAmount,
          priceImpactBps,
          priceImpactBpsWithoutFee,
        }) => {
          return {
            receiveFarmTokenAmt,
            receiveBaseTokenAmt,
            amountToTrade,
            tokenOutAmount,
            priceImpactBps,
            priceImpactBpsWithoutFee,
          }
        })
      )
    }),
    catchError(() => {
      return of({
        error: true,
        receiveFarmTokenAmt: 0,
        receiveBaseTokenAmt: 0,
        amountToTrade: 0,
        tokenOutAmount: 0,
        priceImpactBps: 0,
        priceImpactBpsWithoutFee: 0,
      })
    })
  )
}

export const getMinimizeResult$ = ({
  workerAddress,
  positionId,
}) => {
  return call$({
    abi: KlayswapCalculatorABI,
    address: KLAYSWAP_CALCULATOR,
    methodName: "getMinimizeResult",
    params: [
      workerAddress,
      positionId,
    ]
  })
}

export const getLpAmounts$ = ({
  workerAddress,
  positionId,
}) => {
  return call$({
    abi: KlayswapCalculatorABI,
    address: KLAYSWAP_CALCULATOR,
    methodName: "getLpAmounts",
    params: [
      workerAddress,
      positionId,
    ]
  }).pipe(
    tap((result) => {

    })
  )
}

export const getLpAmounts_kokonut$ = ({
  workerAddress,
  positionId,
}) => {
  return call$({
    abi: KokonutswapCalculatorABI,
    address: KOKONUTSWAP_CALCULATOR,
    methodName: "getLpAmounts",
    params: [
      workerAddress,
      positionId,
    ]
  }).pipe(
    tap((result) => {
      console.log(result, '@result')
    })
  )
}

export const getLpIngridients$ = ({
  workerAddress,
  positionId,
}) => {
  return call$({
    abi: KlayswapCalculatorABI,
    address: KLAYSWAP_CALCULATOR,
    methodName: "getLpIngridients",
    params: [
      workerAddress,
      positionId,
    ]
  }).pipe(
    map(({ baseAmt, farmAmt }) => {
      return {
        baseAmt,
        farmAmt,
      }
    })
  )
}

export const getPartialCloseBaseOnlyResult$ = ({
  workerAddress,
  positionId,
  closedLpAmt,
  debtToRepay,
}) => {
  return call$({
    abi: KlayswapCalculatorABI,
    address: KLAYSWAP_CALCULATOR,
    methodName: "getPartialCloseBaseOnlyResult",
    params: [
      workerAddress,
      positionId,
      closedLpAmt,
      debtToRepay,
    ]
  }).pipe(
    switchMap(({
      updatedPositionValue,
      updatedHealth,
      updatedDebtAmt,
      receiveBaseTokenAmt,
      receiveFarmTokenAmt,
      amountToTrade,
    }) => {

      const worker = workerByAddress[workerAddress]

      return getDexSelling$({
        tokenIn: worker.farmingToken.address,
        tokenInAmount: amountToTrade,
        tokenOut: worker.baseToken.address,
      }).pipe(
        map(({
          tokenOutAmount,
          priceImpactBps,
          priceImpactBpsWithoutFee,
        }) => {
          return {
            updatedPositionValue,
            updatedHealth,
            updatedDebtAmt,
            receiveBaseTokenAmt,
            receiveFarmTokenAmt,
            amountToTrade,

            tokenOutAmount,
            priceImpactBps,
            priceImpactBpsWithoutFee,
          }
        })
      )
    }),
    catchError(() => {
      return of({
        error: true,
        updatedPositionValue: 0,
        updatedHealth: 0,
        updatedDebtAmt: 0,
        receiveBaseTokenAmt: 0,
        receiveFarmTokenAmt: 0,
        amountToTrade: 0,

        tokenOutAmount: 0,
        priceImpactBps: 0,
        priceImpactBpsWithoutFee: 0,
      })
    })
  )
}

export const getPartialCloseBaseOnlyResult_kokonut$ = ({
  workerAddress,
  positionId,
  closedLpAmt,
  debtToRepay,
}) => {
  return call$({
    abi: KokonutswapCalculatorABI,
    address: KOKONUTSWAP_CALCULATOR,
    methodName: "getPartialCloseBaseOnlyResult",
    params: [
      workerAddress,
      positionId,
      closedLpAmt,
      debtToRepay,
    ]
  }).pipe(
    catchError(() => {
      return of({
        error: true,
        updatedPositionValue: 0,
        updatedHealth: 0,
        updatedDebtAmt: 0,
        receiveBaseTokenAmt: 0,
      })
    })
  )
}

export const getPartialCloseMinimizeResult$ = ({
  workerAddress,
  positionId,
  closedLpAmt,
  debtToRepay,
}) => {

  return call$({
    abi: KlayswapCalculatorABI,
    address: KLAYSWAP_CALCULATOR,
    methodName: "getPartialCloseMinimizeResult",
    params: [
      workerAddress,
      positionId,
      closedLpAmt,
      debtToRepay,
    ]
  }).pipe(
    switchMap(({
      updatedPositionValue,
      updatedHealth,
      updatedDebtAmt,
      receiveBaseTokenAmt,
      receiveFarmTokenAmt,
      amountToTrade,
    }) => {

      const worker = workerByAddress[workerAddress]

      return getDexSelling$({
        tokenIn: worker.farmingToken.address,
        tokenInAmount: amountToTrade,
        tokenOut: worker.baseToken.address,
      }).pipe(
        map(({
          tokenOutAmount,
          priceImpactBps,
          priceImpactBpsWithoutFee,
        }) => {

          return {
            updatedPositionValue,
            updatedHealth,
            updatedDebtAmt,
            receiveBaseTokenAmt,
            receiveFarmTokenAmt,
            amountToTrade,

            tokenOutAmount,
            priceImpactBps,
            priceImpactBpsWithoutFee,
          }
        })
      )
    }),
    catchError(() => {
      return of({
        error: true,
        updatedPositionValue: 0,
        updatedHealth: 0,
        updatedDebtAmt: 0,
        receiveBaseTokenAmt: 0,
        receiveFarmTokenAmt: 0,
        amountToTrade: 0,

        tokenOutAmount: 0,
        priceImpactBps: 0,
        priceImpactBpsWithoutFee: 0,
      })
    })
  )
}

export const getAmountToTrade$ = ({
  workerAddress,
  positionId,
  closedLpAmt,
  debtToRepay,
}) => {
  return call$({
    abi: KlayswapCalculatorABI,
    address: KLAYSWAP_CALCULATOR,
    methodName: "getAmountToTrade",
    params: [
      workerAddress,
      positionId,
      closedLpAmt,
      debtToRepay,
    ]
  }).pipe(
    map(({
      amountToTrade,
      remainingBaseTokenAmt,
    }) => {
      return {
        amountToTrade,
        remainingBaseTokenAmt,
      }
    })
  )
}

export const getDexSelling$ = ({
  tokenIn,
  tokenInAmount,
  tokenOut,
}) => {

  if (tokenInAmount == 0) {
    return of({
      tokenOutAmount: 0,
      priceImpactBps: 0,
      priceImpactBpsWithoutFee: 0,
    })
  }

  return call$({
    abi: KlayswapCalculatorABI,
    address: KLAYSWAP_CALCULATOR,
    methodName: "getDexSelling",
    params: [
      tokenIn,
      tokenInAmount,
      tokenOut,
    ]
  }).pipe(
    map(({
      tokenOutAmount,
      priceImpactBps,
      priceImpactBpsWithoutFee,
    }) => {
      return {
        tokenOutAmount,
        priceImpactBps,
        priceImpactBpsWithoutFee,
      }
    })
  )
}

export const optimalSwap$ = ({ workerAddress, amtA, amtB }) => {
  return call$({
    abi: KlayswapCalculatorABI,
    address: KLAYSWAP_CALCULATOR,
    methodName: "optimalDeposit",
    params: [
      workerAddress,
      amtA,
      amtB,
    ]
  })
}

export const getPositionValue$ = ({ workerAddress, baseTokenAmount, farmingTokenAmount }) => {
  return call$({
    abi: KlayswapCalculatorABI,
    address: KLAYSWAP_CALCULATOR,
    methodName: "getPositionValue",
    params: [
      workerAddress,
      baseTokenAmount,
      farmingTokenAmount,
    ]
  }).pipe(
    catchError(() => of(0))
  )
}

export const getDebtRepaymentRange$ = ({
  workerAddress,
  positionId,
  closedLpAmt,
}) => {

  return call$({
    abi: KlayswapCalculatorABI,
    address: KLAYSWAP_CALCULATOR,
    methodName: "getDebtRepaymentRange",
    params: [
      workerAddress,
      positionId,
      closedLpAmt,
    ]
  }).pipe(
    map(({
      closedPositionValue,
      closedHealth,
      minDebtRepayment,
      maxDebtRepayment,
    }) => {
      return {
        closedPositionValue,
        closedHealth,
        minDebtRepayment,
        maxDebtRepayment,
      }
    })
  )
}

export const getDebtRepaymentRange_kokonut$ = ({
  workerAddress,
  positionId,
  closedLpAmt,
}) => {

  return call$({
    abi: KokonutswapCalculatorABI,
    address: KOKONUTSWAP_CALCULATOR,
    methodName: "getDebtRepaymentRange",
    params: [
      workerAddress,
      positionId,
      closedLpAmt,
    ]
  }).pipe(
    map(({
      closedPositionValue,
      closedHealth,
      minDebtRepayment,
      maxDebtRepayment,
    }) => {
      return {
        closedPositionValue,
        closedHealth,
        minDebtRepayment,
        maxDebtRepayment,
      }
    })
  )
}

// KNS
export const getKNSName$ = (address) => {
  return call$({
    abi: KNS_REVERSE_RECORDS_ABI,
    address: KNS_REVERSE_RECORDS_ADDRESS,
    methodName: "getName",
    params: [address]
  })
}

// Kokonutswap Calculator
export const getOpenPositionResult_kokonut$ = ({
  workerAddress,
  tokenAmounts,
  positionId,
}) => {

  return call$({
    abi: KokonutswapCalculatorABI,
    address: KOKONUTSWAP_CALCULATOR,
    methodName: "getOpenPositionResult",
    params: [
      workerAddress,
      tokenAmounts,
      positionId,
    ]
  }).pipe(
    tap(console.log),
    catchError((e) => {
      console.log(e, 'E')
      return of({
        receiveTokensAmt: [0, 0, 0, 0],
        receiveLpAmt: 0,
        lpAmtOnBalanced: 0,
      })
    })
  )
}

export const getPositionValue_kokonut$ = ({ workerAddress, tokenAmounts }) => {

  console.log(workerAddress, 'workerAddress')
  console.log(tokenAmounts, 'tokenAmounts')

  return call$({
    abi: KokonutswapCalculatorABI,
    address: KOKONUTSWAP_CALCULATOR,
    methodName: "getPositionValue",
    params: [
      workerAddress,
      tokenAmounts,
    ]
  }).pipe(
    catchError((e) => {
      console.log(e, 'p err')
      return of(0)
    })
  )
}

export const getBorrowAmount$ = ({
  workerAddress,
  baseTokenAmount,
  farmingTokenAmount,
  positionId,
  workFactorBps,
}) => {
  return call$({
    abi: KlayswapCalculatorABI,
    address: KLAYSWAP_CALCULATOR,
    methodName: "getBorrowAmount",
    params: [
      workerAddress,
      baseTokenAmount,
      farmingTokenAmount,
      positionId,
      workFactorBps,
    ]
  }).pipe(
    catchError((e) => {
      console.log(e, 'getbrramt err')
      return of(0)
    })
  )
}

export const getMembershipInfo$ = ({ workerAddress, userAddress }) => {
  console.log(workerAddress, 'workerAddress')
  console.log(userAddress, 'userAddress')
  return call$({
    abi: KlayswapCalculatorABI,
    address: KLAYSWAP_CALCULATOR,
    methodName: "membershipInfo",
    params: [
      workerAddress,
      userAddress || "0x" + "0".repeat(40),
    ]
  }).pipe(
    catchError((e) => {
      console.log(e, 'getMembershipInfo err')
      return of(0)
    })
  )
}