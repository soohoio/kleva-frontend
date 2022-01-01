import Caver from 'caver-js'
import Web3 from 'web3'
import { forkJoin, from, interval, Observable, of, Subject } from 'rxjs'
import { tap, catchError, map, switchMap, startWith, filter, takeUntil } from 'rxjs/operators'
import { Interface } from '@ethersproject/abi'
import BigNumber from 'bignumber.js'
import { flatten, pick } from 'lodash'

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
import VaultConfigABI from 'abis/VaultConfig.json'
import KLEVATokenABI from 'abis/KLEVAToken.json'

// Klayswap 
import KlayswapExchangeABI from 'abis/KlayswapExchange.json'

// WKLAY
import WKLAYABI from 'abis/WKLAY.json'

import { closeModal$, isFocused$ } from './ui'
import { coupleArray } from '../utils/misc'
import { executeContractKlip$ } from './klip'

import { MAX_UINT } from 'constants/setting'
import { showParamsOnCall } from '../utils/callHelper'
import { lpTokenByIngredients, tokenList } from '../constants/tokens'
import { isValidDecimal, toFixed } from '../utils/calc'

const NODE_URL = 'https://klaytn-secure.staging.sooho.io/'
export const caver = new Caver(NODE_URL)

window.BigNumber = BigNumber

const getBlockNumber$ = (web3Instance) => from(
  caver.klay.getBlockNumber()
).pipe(
  catchError((err) => {
    return of(0)
  })
)

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
      if (gas instanceof Error) {
        alert("error occurred.")
        return
      }

      // Klip

      if (walletType$.value === "klip") {
        executeContractKlip$({
          to: txObject.to,
          value: new BigNumber(txObject.value).toString(),
          abi: _method._method,
          params: method.arguments,
        }).pipe(
          catchError((e) => {
            console.log('klip error_', e)
            return of(false)
          })
        ).subscribe((result) => {
          observer.next(result)
          observer.complete(result)

          // TODO?
          if (!isMobile) {
            closeModal$.next(true)
          }
        })
        return
      }

      // Injected
      const _gas = Number.isNaN(Math.min(40000000, gas)) 
        ? 4000000
        : Math.min(40000000, gas)

      window.injected.sendAsync({
        method: window.injected && window.injected.isMetaMask
          ? 'eth_sendTransaction'
          : 'klay_sendTransaction',
        params: [{ ...txObject, data, gas: `0x${new BigNumber(_gas).plus(1000000).toString(16)}` }],
        from: window.injected.selectedAddress
      }, (err, result) => {

        const userDenied = result
          && result.error
          && result.error.message
          && result.error.message.indexOf('denied')

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
    console.log(e, '@e')
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

export const approve$ = (tokenAddress, spender, amount) =>
  makeTransaction({ abi: IERC20ABI, address: tokenAddress, methodName: "approve", params: [spender, amount] })

// Total Token = Total Supply + Total Borrowed
export const listTokenSupplyInfo$ = (lendingPools, account) => {
  
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
    map(([totalTokens, balances, totalSupplies, totalDebtValues]) => {
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
          totalBorrowedPure: new BigNumber(cur.totalToken._hex)
            .minus(cur.balance._hex)
            .toString(),

          totalSupply: new BigNumber(cur.totalToken._hex)
            .div(10 ** stakingTokenDecimals)
            .toString(),
          totalBorrowed: new BigNumber(cur.totalToken._hex)
            .minus(cur.balance._hex)
            .div(10 ** stakingTokenDecimals)
            .toString(),
          totalUnborrowed: new BigNumber(cur.balance._hex)
            .div(10 ** stakingTokenDecimals)
            .toString(),
          tvl: new BigNumber(cur.totalToken._hex)
            .div(10 ** stakingTokenDecimals)
            .multipliedBy()
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

      return from(m_borrowingIntrests).pipe(
        map((_borrowingInterests) => {
          const borrowingInterests = flatten(_borrowingInterests).reduce((acc, cur) => {
            acc.push(new BigNumber(cur._hex).toString())
            return acc
          }, [])

          return Object.entries(totalInfo).reduce((acc, [vaultAddress, item], idx) => {  
            const _borrowingInterest = new BigNumber(borrowingInterests[idx])
              .multipliedBy(60 * 60 * 24 * 365)
              .div(10 ** 18)
              .multipliedBy(100)
              .toString()

            acc[vaultAddress] = {
              ...item,
              borrowingInterest: _borrowingInterest,
            }

            acc[item.ibToken.originalToken.address] = { borrowingInterest: _borrowingInterest, }
            acc[item.ibToken.originalToken.address.toLowerCase()] = { borrowingInterest: _borrowingInterest, }

            return acc
          }, {})
        })
      )
    })
  )
}

export const balanceOfMultiInWallet$ = (account, tokenAddresses) => {

  // Klay Balance
  // const p0 = caver.klay.getBalance(account)
  // BNB Balance
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

  console.log(nativeCoinAmount, "nativeCoinAmount")
  
  if (walletType$.value === 'klip' && (nativeCoinAmount === tokenAmount)) {
    const valueSplitted = Number(nativeCoinAmount / 10 ** 18)
      .toLocaleString('en-us', { maximumFractionDigits: 18 }).split('.')

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

export const closePosition$ = (vaultAddress, { positionId, data }) => {

  return makeTransaction({
    abi: VaultABI,
    address: vaultAddress,
    methodName: "editPosition",
    params: [positionId, 0, 0, MAX_UINT, data],
  })
}

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

export const allowancesMultiInLendingPool$ = (account, lendingPools) => {

  const p1 = multicall(
    IERC20ABI,
    lendingPools.map(({ stakingToken, vaultAddress }, idx) => {
      return { address: stakingToken && stakingToken.address, name: 'allowance', params: [account, vaultAddress] }
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
  const p1 = multicall(
    VaultABI,
    positionList.map(({ vaultAddress, id }) => {
      return { address: vaultAddress, name: 'positionInfo', params: [id] }
    })
  )

  return from(p1).pipe(
    map((positionInfoList) => {
      return flatten(positionInfoList).reduce((acc, cur, idx) => {

        const _position = positionList[parseInt(idx / 2)]

        acc[_position.id] = acc[_position.id] || { ..._position }
        acc[_position.id][idx % 2 === 0 ? 'positionValue' : 'debtValue'] = new BigNumber(cur._hex).toString()
        
        return acc
      }, {})
    }),
    map((positionInfoMap) => {
      return Object.entries(positionInfoMap).reduce((acc, [positionId, item]) => {
        acc.push(item)
        return acc
      }, [])
    })
  )
}

export const getWorkerInfo$ = (workerList) => {
  // KillFactorBPS
  const p1 = multicall(
    KlayswapWorkerABI,
    workerList.map(({ workerAddress, id }) => {
      return { address: workerAddress, name: 'killFactorBps', params: [] }
    })
  )
  
  const p2 = multicall(
    KlayswapWorkerABI,
    workerList.map(({ workerAddress, id }) => {
      return { address: workerAddress, name: 'workFactorBps', params: [] }
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
      return { address: workerAddress, name: 'rawKillFactorBps', params: [] }
    })
  )

  return forkJoin(p1, p2, p3, p4).pipe(
    map(([killFactorBpsList, workFactorBpsList, lpPoolIdList, rawKillFactorBpsList]) => {

      const coupled = coupleArray({
        arrayA: flatten(killFactorBpsList),
        labelA: 'killFactorBps',
        arrayB: flatten(workFactorBpsList),
        labelB: 'workFactorBps',
        arrayC: flatten(lpPoolIdList),
        labelC: 'lpPoolId',
        arrayD: flatten(rawKillFactorBpsList),
        labelD: 'rawKillFactorBps',
      })

      return flatten(coupled).reduce((acc, cur, idx) => {
        const _worker = workerList[idx]
        const workerAddress = _worker && _worker.workerAddress

        acc[workerAddress] = {
          // Deposited real token balance
          ..._worker,
          killFactorBps: new BigNumber(cur.killFactorBps._hex).toString(),
          workFactorBps: new BigNumber(cur.workFactorBps._hex).toString(),
          rawKillFactorBps: new BigNumber(cur.rawKillFactorBps._hex).toString(),
          lpPoolId: new BigNumber(cur.lpPoolId._hex).toString(),
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

export const getOutputTokenAmount$ = (lpTokenAddress, inputTokenAddress, inputTokenAmount) => {  
  console.log(inputTokenAmount, '@inputTokenAmount')
  return forkJoin(
    getCurrentPool$(lpTokenAddress),
    getOutputAmount$(lpTokenAddress, inputTokenAddress, inputTokenAmount),
  ).pipe(
    map(([currentPool, outputAmount]) => {
      const originalRatio = currentPool.outputAmountA / currentPool.outputAmountB
      const optimalOutputAmount = inputTokenAmount * originalRatio
      const realOutputAmount = outputAmount
      const priceImpact = 1 - (optimalOutputAmount / realOutputAmount)

      return { outputAmount, priceImpact }
    })
  )
}

export const getOutputAmount$ = (lpTokenAddress, inputTokenAddress, inputTokenAmount) => {
  return call$({ abi: KlayswapExchangeABI, address: lpTokenAddress, methodName: 'estimatePos', params: [inputTokenAddress, inputTokenAmount] })
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

  return from(p1).pipe(
    map((reserves) => {
      return flatten(reserves).reduce((acc, cur, idx) => {
        const lpToken = lpTokenList[parseInt(idx / 2)]
        const tokenA = lpToken && lpToken.ingredients[0]
        const tokenB = lpToken && lpToken.ingredients[1]

        acc[lpToken.address] = acc[lpToken.address] || {}

        if (idx % 2 === 0) {
          acc[lpToken.address] = {
            title: lpToken.title,
            ...acc[lpToken.address],
            [tokenA.address]: new BigNumber(cur._hex).toString()
          }
        } else {
          acc[lpToken.address] = {
            title: lpToken.title,
            ...acc[lpToken.address],
            [tokenB.address]: new BigNumber(cur._hex).toString()
          }
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
  const p1 = multicall(
    FairLaunchABI,
    fairLaunchPoolList.map(({ pid }) => {
      return { address: FAIRLAUNCH, name: 'poolInfos', params: [pid] }
    })
  )

  const p2 = call$({ abi: FairLaunchABI, address: FAIRLAUNCH, methodName: 'getRewardPerBlock', params: [] })
  const p3 = call$({ abi: FairLaunchABI, address: FAIRLAUNCH, methodName: 'getTotalAllocPoint', params: [] })

  return forkJoin(
    from(p1),
    from(p2),
    from(p3),
  ).pipe(
    map(([poolInfos, rewardPerBlock, totalAllocPoint]) => {

      return showParamsOnCall(poolInfos, [
        'vaultToken',
        'allocPoint',
        'lastRewardBlockNumber',
        'accRewardPerShare',
      ]).reduce((acc, cur, idx) => {
        const pool = fairLaunchPoolList[idx]

        acc[pool.pid] = new BigNumber(rewardPerBlock)
          .multipliedBy(86400 * 365) // 1 year
          .div(10 ** tokenList.KLEVA.decimals)
          .multipliedBy(cur.allocPoint)
          .div(totalAllocPoint)
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

export const getFarmDeposited$ = (farmPools, workerInfoMap) => {  
  const multicallArray = flatten(farmPools.reduce((acc, cur, farmIdx) => {

    const feedForMulticall = cur.workerList.map(({ workerAddress }, workerIdx) => {
      const workerInfo = workerInfoMap[workerAddress]

      return { 
        address: FAIRLAUNCH, 
        name: 'userInfos', 
        params: [workerInfo.lpPoolId, workerAddress],
        info: { 
          farmIdx: farmIdx, 
          farm: cur,
          lpToken: lpTokenByIngredients(cur.token1, cur.token2)
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
        const _deposited = new BigNumber(cur.amount || 0)
          .div(10 ** multicallArrayItem.info.lpToken.decimals)
        
          acc[multicallArrayItem.info.farmIdx] = {
          
            deposited: new BigNumber(acc[multicallArrayItem.info.farmIdx] && acc[multicallArrayItem.info.farmIdx].deposited || 0)
              .plus(_deposited)
              .toNumber(),

            lpToken: multicallArrayItem.info.lpToken,
        }

        return acc
      }, {})
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
export const addCollateral$ = (vaultAddress, { positionId, principalAmount, data }) => {
  return makeTransaction({
    abi: VaultABI,
    address: vaultAddress,
    methodName: "addCollateral",
    params: [positionId, principalAmount, data]
  })
}

// add collateral & borrow
export const addCollateralWithBorrowing$ = (vaultAddress, { positionId, principalAmount, debtAmount, data }) => {
  return makeTransaction({
    abi: VaultABI,
    address: vaultAddress,
    methodName: "editPosition",
    params: [positionId, principalAmount, debtAmount, 0, data]
  })
}

export const minimizeTrading$ = (vaultAddress, { positionId, data }) => {
  /*
        const ext2 = abiCoder.encode(["uint256"], ["0"]);
        const data2 = abiCoder.encode(
            ["address", "bytes"],
            [_minimizeTradingStrategyService.address, ext2]
        );
  */

  return makeTransaction({
    abi: VaultABI,
    address: vaultAddress,
    methodName: "editPosition",
    params: [positionId, 0, 0, MAX_UINT, data]
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
  /*
    abi.encode(
      KlayswapPartialMinimizeTradingStrategy_address, 
      abi.encode(maxLpTokenToLiquidate, maxDebtRepayment, minFarmingTokenAmount)
    )
  */
  return makeTransaction({
    abi: VaultABI,
    address: vaultAddress,
    methodName: "editPosition",
    params: [positionId, 0, 0, maxDebtRepayment, data]
  })
}

// Unlock
export const calcUnlockableAmount$ = (account) => call$({
  abi: KLEVATokenABI,
  methodName: 'calcUnlockableAmount',
  address: tokenList.KLEVA.address,
  params: [account],
})

export const unlock$ = (account) => makeTransaction({
  abi: KLEVATokenABI,
  address: account,
  methodName: "unlock",
  params: []
})