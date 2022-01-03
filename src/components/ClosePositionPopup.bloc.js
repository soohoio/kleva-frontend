import { BehaviorSubject } from 'rxjs'
import { switchMap } from 'rxjs/operators'

import { STRATEGIES } from '../constants/address'
import { caver, convertToBaseToken$, getTransactionReceipt$, minimizeTrading$ } from '../streams/contract'
import { fetchWalletInfo$ } from '../streams/wallet'

export default class {
  constructor({ 
    positionId,
    vaultAddress,
    farmingToken,
    baseToken,
    workerInfo,
  }) {
    // 'minimizeTrading', 'convertToBaseToken'
    this.positionId = positionId
    this.vaultAddress = vaultAddress
    this.farmingToken = farmingToken
    this.baseToken = baseToken

    this.workerInfo = workerInfo

    this.farmingTokenAmount$ = new BehaviorSubject('')
    this.baseTokenAmount$ = new BehaviorSubject('')
    this.farmingTokenAmountInBaseToken$ = new BehaviorSubject('')

    this.positionValue$ = new BehaviorSubject()
    this.equityValue$ = new BehaviorSubject()
    this.debtValue$ = new BehaviorSubject()
    
    this.closingMethod$ = new BehaviorSubject('convertToBaseToken')
  }

  closePosition = () => {
    if (this.closingMethod$.value === "convertToBaseToken") {
      this.convertToBaseToken()
      return
    }

    if (this.closingMethod$.value === "minimizeTrading") {
      this.minimizeTrading()
    }
  }

  convertToBaseToken = () => {
    const strategyAddress = STRATEGIES["LIQUIDATE_STRATEGY"]
    // @TODO
    const MIN_BASE_TOKEN_AMOUNT = 0
    const ext = caver.klay.abi.encodeParameters(['uint256'], [MIN_BASE_TOKEN_AMOUNT])
    const data = caver.klay.abi.encodeParameters(['address', 'bytes'], [strategyAddress, ext])

    convertToBaseToken$(this.vaultAddress, {
      positionId: this.positionId,
      data,
    }).pipe(
      switchMap((result) => getTransactionReceipt$(result && result.result || result.tx_hash))
    ).subscribe((result) => {
      fetchWalletInfo$.next(true)
    })
  }

  minimizeTrading = () => {
    const strategyAddress = STRATEGIES["MINIMIZE_TRADING_STRATEGY"]
    
    // @TODO
    const MIN_FARMING_TOKEN_AMOUNT = 0

    const ext = caver.klay.abi.encodeParameters(['uint256'], [MIN_FARMING_TOKEN_AMOUNT])
    const data = caver.klay.abi.encodeParameters(
      ['address', 'bytes'], 
      [strategyAddress, ext]
    )

    minimizeTrading$(this.vaultAddress, {
      positionId: this.positionId,
      data,
    }).pipe(
      switchMap((result) => getTransactionReceipt$(result && result.result || result.tx_hash))
    ).subscribe((result) => {
      fetchWalletInfo$.next(true)
    })
  }
}