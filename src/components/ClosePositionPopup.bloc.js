import { BehaviorSubject } from 'rxjs'
import { switchMap } from 'rxjs/operators'
import BigNumber from 'bignumber.js'

import { STRATEGIES } from '../constants/address'
import { caver, convertToBaseToken$, getTransactionReceipt$, minimizeTrading$, partialCloseLiquidate$, partialMinimizeTrading$ } from '../streams/contract'
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

    // Based on lp share / lp total supply
    this.lpToken$ = new BehaviorSubject()
    this.lpShare$ = new BehaviorSubject()
    this.userFarmingTokenAmount$ = new BehaviorSubject()
    this.userBaseTokenAmount$ = new BehaviorSubject()

    this.health$ = new BehaviorSubject()
    
    this.closingMethod$ = new BehaviorSubject('convertToBaseToken')

    // Partial
    this.partialCloseRatio$ = new BehaviorSubject(0)
    this.repayDebtRatio$ = new BehaviorSubject(0)
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

  partialConvertToBaseToken = () => {
    const strategyAddress = STRATEGIES["PARTIAL_LIQUIDATE_STRATEGY"]
    // @TODO
    const MAX_LP_TOKEN_TO_LIQUIDATE = new BigNumber(this.lpShare$.value)
      .multipliedBy(this.partialCloseRatio$.value)
      .toFixed(0)

    const MAX_DEBT_REPAYMENT = new BigNumber(MAX_LP_TOKEN_TO_LIQUIDATE)
      .multipliedBy(this.repayDebtRatio$)
      .toFixed(0)

    const MIN_BASE_TOKEN_AMOUNT = 0
    
    const ext = caver.klay.abi.encodeParameters(['uint256', 'uint256', 'uint256'], [
      MAX_LP_TOKEN_TO_LIQUIDATE,
      MAX_DEBT_REPAYMENT,
      MIN_BASE_TOKEN_AMOUNT,
    ])
    const data = caver.klay.abi.encodeParameters(['address', 'bytes'], [strategyAddress, ext])

    partialCloseLiquidate$(this.vaultAddress, {
      positionId: this.positionId,
      maxDebtRepayment: MAX_DEBT_REPAYMENT,
      data,
    }).pipe(
      switchMap((result) => getTransactionReceipt$(result && result.result || result.tx_hash))
    ).subscribe((result) => {
      fetchWalletInfo$.next(true)
    })
  }

  partialMinimizeTrading = () => {
    const strategyAddress = STRATEGIES["PARTIAL_MINIMIZE_TRADING_STRATEGY"]
    // @TODO
    const MAX_LP_TOKEN_TO_LIQUIDATE = new BigNumber(this.lpShare$.value)
      .multipliedBy(this.partialCloseRatio$.value)
      .toFixed(0)

    const MAX_DEBT_REPAYMENT = new BigNumber(MAX_LP_TOKEN_TO_LIQUIDATE)
      .multipliedBy(this.repayDebtRatio$)
      .toFixed(0)

    const MIN_FARMING_TOKEN_AMOUNT = 0

    const ext = caver.klay.abi.encodeParameters(['uint256', 'uint256', 'uint256'], [
      MAX_LP_TOKEN_TO_LIQUIDATE,
      MAX_DEBT_REPAYMENT,
      MIN_FARMING_TOKEN_AMOUNT,
    ])
    
    const data = caver.klay.abi.encodeParameters(['address', 'bytes'], [strategyAddress, ext])

    partialMinimizeTrading$(this.vaultAddress, {
      positionId: this.positionId,
      maxDebtRepayment: MAX_DEBT_REPAYMENT,
      data,
    }).pipe(
      switchMap((result) => getTransactionReceipt$(result && result.result || result.tx_hash))
    ).subscribe((result) => {
      fetchWalletInfo$.next(true)
    })
  }
}