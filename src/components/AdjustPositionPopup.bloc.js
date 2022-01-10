import { BehaviorSubject, forkJoin, Subject } from "rxjs"
import { switchMap } from "rxjs/operators"
import BigNumber from 'bignumber.js'

import { tokenList } from '../constants/tokens'
import { MAX_UINT } from 'constants/setting'
import { STRATEGIES } from 'constants/address'

import { 
  addCollateral$, 
  caver, 
  getOutputTokenAmount$, 
  approve$, 
  getTransactionReceipt$,
  borrowMore$,
} from '../streams/contract'
import { closeModal$ } from "../streams/ui"
import { fetchWalletInfo$ } from "../streams/wallet"

export default class {
  constructor({ 
    positionId, 
    vaultAddress,
    farmingToken,
    baseToken,
    workerInfo,
  }) {
    this.positionId = positionId
    this.vaultAddress = vaultAddress
    this.farmingToken = farmingToken
    this.baseToken = baseToken

    this.workerInfo = workerInfo
    
    this.farmingTokenAmount$ = new BehaviorSubject('')
    this.baseTokenAmount$ = new BehaviorSubject('')
    this.farmingTokenAmountInBaseToken$ = new BehaviorSubject('')

    this.allowances$ = new BehaviorSubject({})
    this.borrowMore$ = new BehaviorSubject(false)

    this.positionValue$ = new BehaviorSubject()
    this.equityValue$ = new BehaviorSubject()
    this.debtValue$ = new BehaviorSubject()

    this.currentPositionLeverage$ = new BehaviorSubject()
    
    this.leverage$ = new BehaviorSubject()

    this.fetchAllowances$ = new Subject()

    this.addCollateralAvailable$ = new BehaviorSubject()
    this.borrowMoreAvailable$ = new BehaviorSubject()
  }

  getStrategy = () => {
    // FarmingTokenAmount Doesn't exist -> AddBaseTokenOnly
    if (this.farmingTokenAmount$.value == 0) {
      return { strategyType: "ADD_BASE_TOKEN_ONLY", strategyAddress: STRATEGIES["ADD_BASE_TOKEN_ONLY"] }
    }

    // FarmingTokenAmount Exists -> AddTwoSidesOptimal
    return { strategyType: "ADD_TWO_SIDES_OPTIMAL", strategyAddress: STRATEGIES["ADD_TWO_SIDES_OPTIMAL"] }
  }

  calcFarmingTokenAmountInBaseToken = () => {
    getOutputTokenAmount$(
      this.farmingToken,
      this.baseToken,
      new BigNumber(this.farmingTokenAmount$.value || 0)
        .multipliedBy(10 ** this.farmingToken.decimals)
        .toFixed(0),
    ).subscribe(({ outputAmount }) => {
      this.farmingTokenAmountInBaseToken$.next(outputAmount)
    })
  }

  approve = (token, vaultAddress) => {
    approve$(token.address, vaultAddress, MAX_UINT).pipe(
      switchMap((result) => getTransactionReceipt$(result && result.result || result.tx_hash))
    ).subscribe((result) => {
      fetchWalletInfo$.next(true)

      this.fetchAllowances$.next(true)
    })
  }

  isKLAY = (address) => address === tokenList.KLAY.address

  addCollateral = () => {
    const { strategyType, strategyAddress } = this.getStrategy()

    const baseTokenAmount = new BigNumber(this.baseTokenAmount$.value || 0)

    // principalAllInBaseToken 
    // == sum(base token amount, convertToBaseTokenAmount(farming token amount))
    // const farmingTokenAmountConvertedInBaseToken = this.farmingTokenAmountInBaseToken$.value
    // const principalAllInBaseToken = baseTokenAmount
    //   .plus(farmingTokenAmountConvertedInBaseToken)
    //   .toString()

    // @TODO
    const MIN_LP_AMOUNT = 0

    const ext = strategyType === "ADD_BASE_TOKEN_ONLY"
      ? caver.klay.abi.encodeParameters(['uint256'], [MIN_LP_AMOUNT])
      : caver.klay.abi.encodeParameters(
        ['uint256', 'uint256'],
        [new BigNumber(this.farmingTokenAmount$.value || 0)
          .multipliedBy(10 ** this.farmingToken.decimals)
          .toString(),
          MIN_LP_AMOUNT
        ])

    const data = caver.klay.abi.encodeParameters(['address', 'bytes'], [strategyAddress, ext])

    const isBaseTokenKLAY = this.isKLAY(this.baseToken.address)

    const principalAmount = baseTokenAmount
      .multipliedBy(10 ** this.baseToken.decimals)
      .toString()

    const _value = isBaseTokenKLAY
      ? baseTokenAmount.multipliedBy(10 ** this.baseToken.decimals).toString()
      : 0

    addCollateral$(this.vaultAddress, {
      positionId: this.positionId,
      principalAmount,
      data,
      value: _value,
    }).pipe(
      switchMap((result) => getTransactionReceipt$(result && result.result || result.tx_hash))
    ).subscribe(() => {
      fetchWalletInfo$.next(true)
      closeModal$.next(true)
    })
  }

  // Borrow more
  borrowMore = () => {
    
    const borrowAmount = new BigNumber(this.equityValue$.value)
      .multipliedBy(this.leverage$.value - 1)
      .multipliedBy(10 ** this.baseToken.decimals)
      .toFixed(0)

    console.log(this.equityValue$.value,"this.equityValue$.value")
    console.log(this.leverage$.value,"this.leverage$.value")
    console.log(borrowAmount, 'borrowAmount')

    const strategyAddress = STRATEGIES["ADD_BASE_TOKEN_ONLY"]
    
    // @TODO
    const MIN_LP_AMOUNT = 0
    const ext = caver.klay.abi.encodeParameters(['uint256'], [MIN_LP_AMOUNT])
    const data = caver.klay.abi.encodeParameters(['address', 'bytes'], [strategyAddress, ext])

    borrowMore$(this.vaultAddress, {
      positionId: this.positionId,
      debtAmount: borrowAmount,
      data,
    }).pipe(
      switchMap((result) => getTransactionReceipt$(result && result.result || result.tx_hash))
    ).subscribe(() => {
      fetchWalletInfo$.next(true)
      closeModal$.next(true)
    })
  }
}