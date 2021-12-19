import { BehaviorSubject } from 'rxjs'
import { switchMap } from 'rxjs/operators'

import { STRATEGIES } from '../constants/address'
import { caver, closePosition$, getTransactionReceipt$ } from '../streams/contract'
import { fetchWalletInfo$ } from '../streams/wallet'

export default class {
  constructor({ positionId, vaultAddress }) {
    // 'minimizeTrading', 'convertToBaseToken'
    this.vaultAddress = vaultAddress
    this.positionId = positionId
    this.closingMethod$ = new BehaviorSubject('convertToBaseToken')
  }

  closePosition = () => {
    const strategyAddress = STRATEGIES["LIQUIDATE_STRATEGY"]
    // @TODO
    const MIN_BASE_TOKEN_AMOUNT = 0
    const ext = caver.klay.abi.encodeParameters(['uint256'], [MIN_BASE_TOKEN_AMOUNT])
    const data = caver.klay.abi.encodeParameters(['address', 'bytes'], [strategyAddress, ext])

    closePosition$(this.vaultAddress, {
      positionId: this.positionId,
      data,
    }).pipe(
      switchMap((result) => getTransactionReceipt$(result && result.result || result.tx_hash))
    ).subscribe((result) => {
      fetchWalletInfo$.next(true)
    })
  }
}