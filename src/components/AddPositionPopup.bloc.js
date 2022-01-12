import { Subject, BehaviorSubject, forkJoin } from 'rxjs'
import { switchMap, tap } from 'rxjs/operators'
import BigNumber from 'bignumber.js'

import { STRATEGIES } from 'constants/address'
import { addPosition$, approve$, caver, getOutputTokenAmount$, getTransactionReceipt$ } from '../streams/contract'
import { fetchWalletInfo$ } from '../streams/wallet'
import { MAX_UINT } from 'constants/setting'
import { lendingPoolsByStakingTokenAddress } from '../constants/lendingpool'
import { tokenList } from '../constants/tokens'
import { closeModal$ } from '../streams/ui'

export default class {
  constructor({ token1, token2, lpToken, workerList, borrowingAvailableAssets }) {
    
    this.token1 = token1
    this.token2 = token2
    
    this.lpToken = lpToken
    this.workerList = workerList

    this.borrowingAsset$ = new BehaviorSubject(borrowingAvailableAssets[0])

    // this.worker$
    this.worker$ = new BehaviorSubject()
    this.selectWorker(this.borrowingAsset$.value)

    this.farmingToken$ = new BehaviorSubject(
      [this.token1, this.token2]
      .find((t) => t.address.toLowerCase() !== this.borrowingAsset$.value.address.toLowerCase())
    )
    this.baseToken$ = new BehaviorSubject(this.borrowingAsset$.value)
    this.farmingTokenAmount$ = new BehaviorSubject('')
    this.baseTokenAmount$ = new BehaviorSubject('')
    this.priceImpact$ = new BehaviorSubject('')
    this.allowances$ = new BehaviorSubject({})
    this.leverage$ = new BehaviorSubject(1)
    this.borrowMoreAvailable$ = new BehaviorSubject(true)

    // ex) Farming Token: 10 KSP, Base Token: 100 KLEVA
    // Convert 10 KSP to [farmingTokenAmountInBaseToken] KLEVA.
    this.farmingTokenAmountInBaseToken$ = new BehaviorSubject()
    this.afterPositionValue$ = new BehaviorSubject()

    this.fetchAllowances$ = new Subject()

    // UI
    this.showAPRDetail$ = new BehaviorSubject(false)
    this.showSummary$ = new BehaviorSubject(false)
  }

  selectWorker = (borrowingAsset) => {
    const selectedWorker = this.workerList.find((w) => {
      return w.baseToken.address.toLowerCase() === borrowingAsset.address.toLowerCase()
    })
    this.worker$.next(selectedWorker)
  }

  selectBorrowingAsset = (borrowingAsset) => {
    this.baseToken$.next(borrowingAsset)
    this.farmingToken$.next([this.token1, this.token2].find((t) => t.address.toLowerCase() !== borrowingAsset.address.toLowerCase()))
    this.baseTokenAmount$.next('')
    this.farmingTokenAmount$.next('')
    this.leverage$.next(1)

    // borrowing asset == base token
    this.borrowingAsset$.next(borrowingAsset)
    this.selectWorker(borrowingAsset)
  }

  getStrategy = () => {
    // FarmingTokenAmount Doesn't exist -> AddBaseTokenOnly
    if (this.farmingTokenAmount$.value == 0) {
      return { strategyType: "ADD_BASE_TOKEN_ONLY", strategyAddress: STRATEGIES["ADD_BASE_TOKEN_ONLY"] }
    }

    // FarmingTokenAmount Exists -> AddTwoSidesOptimal
    return { strategyType: "ADD_TWO_SIDES_OPTIMAL", strategyAddress: STRATEGIES["ADD_TWO_SIDES_OPTIMAL"] }
  }

  calcFarmingTokenAmountInBaseToken$ = () => {
    return getOutputTokenAmount$(
      this.farmingToken$.value || 0,
      this.baseToken$.value || 0,
      new BigNumber(this.farmingTokenAmount$.value || 0)
        .multipliedBy(10 ** this.farmingToken$.value.decimals)
        .toFixed(0),
    ).pipe(
      tap(({ outputAmount }) => {
        this.farmingTokenAmountInBaseToken$.next(
          new BigNumber(outputAmount)
            .div(10 ** this.baseToken$.value.decimals)
            .toString()
          )
      })
    )
  }

  getPriceImpact = (_poolReserves) => {

    let swapFromToken
    let swapToToken
    
    let swapFromTokenAmount

    // FarmingTokenAmount Doesn't exist -> AddBaseTokenOnly
    if (this.farmingTokenAmount$.value == 0) {
      swapFromToken = this.baseToken$.value
      swapToToken = this.farmingToken$.value
      swapFromTokenAmount = new BigNumber(this.baseTokenAmount$.value || 0).multipliedBy(0.5).toString()

      getOutputTokenAmount$(
        swapFromToken,
        swapToToken,
        new BigNumber(swapFromTokenAmount || 0)
          .multipliedBy(10 ** swapFromToken.decimals)
          .toString(),
      ).subscribe(({ outputAmount, priceImpact }) => {
        this.priceImpact$.next(priceImpact)
      })

      return
    }

    // AddTwoSidesOptimal

    const poolReserves = _poolReserves[this.lpToken.address.toLowerCase()]

    const baseTokenReserve = poolReserves[this.baseToken$.value.address.toLowerCase()]
    const farmingTokenReserve = poolReserves[this.farmingToken$.value.address.toLowerCase()]
    
    const baseAmountWithFarmReserve = new BigNumber(this.baseTokenAmount$.value).multipliedBy(farmingTokenReserve)
    const farmAmountWithBaseReserve = new BigNumber(this.farmingTokenAmount$.value).multipliedBy(baseTokenReserve)

    swapFromToken = baseAmountWithFarmReserve >= farmAmountWithBaseReserve 
      ? this.baseToken$.value
      : this.farmingToken$.value

    swapToToken = swapFromToken.address == this.baseToken$.value.address 
      ? this.farmingToken$.value
      : this.baseToken$.value,

    swapFromTokenAmount = baseAmountWithFarmReserve >= farmAmountWithBaseReserve
      ? this.baseTokenAmount$.value
      : this.farmingTokenAmount$.value

    getOutputTokenAmount$(
      swapFromToken,
      swapToToken,
      new BigNumber(swapFromTokenAmount || 0)
        .multipliedBy(10 ** swapFromToken.decimals)
        .toString(),
    ).subscribe(({ outputAmount, priceImpact }) => {
      this.priceImpact$.next(priceImpact)
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

  getPositionValue = () => {
    const baseTokenAmount = new BigNumber(this.baseTokenAmount$.value || 0)
      .multipliedBy(10 ** (this.baseToken$.value && this.baseToken$.value.decimals))

    // principalAllInBaseToken 
    // == sum(base token amount, convertToBaseTokenAmount(farming token amount))

    return new BigNumber(baseTokenAmount)
      .plus(new BigNumber(this.farmingTokenAmountInBaseToken$.value || 0).multipliedBy(10 ** this.baseToken$.value.decimals))
      // .multipliedBy(10 ** this.baseToken$.value.decimals)
      .toString()
  }

  getAmountToBorrow = () => {
    const positionValue = this.getPositionValue()
    const leverage = this.leverage$.value
    const baseTokenDecimal = this.baseToken$.value.decimals

    return new BigNumber(positionValue)
      .multipliedBy(leverage - 1)
      .toFixed(0)
  }

  getAfterPositionValue = () => {
    this.calcFarmingTokenAmountInBaseToken$().pipe(
      switchMap(() => {
        const baseTokenAmount = new BigNumber(this.baseTokenAmount$.value || 0)
          .multipliedBy(10 ** (this.baseToken$.value && this.baseToken$.value.decimals))
    
        const borrowingAmount = new BigNumber(this.getAmountToBorrow() || 0)
    
        // principalAllInBaseToken 
        // == sum(base token amount, convertToBaseTokenAmount(farming token amount))
        const farmingTokenAmountConvertedInBaseToken = this.farmingTokenAmountInBaseToken$.value || 0
    
        const afterPositionValueInBaseToken = new BigNumber(baseTokenAmount)
          .plus(borrowingAmount)
          .plus(farmingTokenAmountConvertedInBaseToken)
          .toNumber() || 0
        
        return getOutputTokenAmount$(
          this.baseToken$.value,
          this.farmingToken$.value,
          new BigNumber(afterPositionValueInBaseToken).div(2).toFixed(0),
        ).pipe(
          tap(({ outputAmount }) => {
            const afterPositionValue = {
              farmingTokenAmount: new BigNumber(outputAmount)
                .div(10 ** this.farmingToken$.value.decimals)
                .toNumber(),
              baseTokenAmount: new BigNumber(afterPositionValueInBaseToken)
                .div(2)
                .div(10 ** this.baseToken$.value.decimals)
                .toNumber(),
            }

            this.afterPositionValue$.next(afterPositionValue)
          })
        )
      })
    ).subscribe()
  }

  addPosition = () => {
    const { strategyType, strategyAddress } = this.getStrategy()

    const baseTokenAmount = new BigNumber(this.baseTokenAmount$.value || 0)
  
    const borrowAmount = this.getAmountToBorrow()

    // @TODO
    const MIN_LP_AMOUNT = 0

    const ext = strategyType === "ADD_BASE_TOKEN_ONLY" 
      ? caver.klay.abi.encodeParameters(['uint256'], [MIN_LP_AMOUNT])
      : caver.klay.abi.encodeParameters(
        ['uint256', 'uint256'], 
        [new BigNumber(this.farmingTokenAmount$.value)
            .multipliedBy(10 ** this.farmingToken$.value.decimals)
            .toString(), 
        MIN_LP_AMOUNT
      ])

    const data = caver.klay.abi.encodeParameters(['address', 'bytes'], [strategyAddress, ext])

    const isBaseTokenKLAY = this.isKLAY(this.baseToken$.value.address)

    const principalAmount = baseTokenAmount
      .multipliedBy(10 ** this.baseToken$.value.decimals)
      .toString()

    const _value = isBaseTokenKLAY
      ? baseTokenAmount.multipliedBy(10 ** this.baseToken$.value.decimals).toString()
      : 0

    addPosition$(this.worker$.value.vaultAddress, {
      workerAddress: this.worker$.value.workerAddress,
      principalAmount,
      borrowAmount, // @TODO
      maxReturn: 0,
      data,
      value: _value,
    }).pipe(
      switchMap((result) => getTransactionReceipt$(result && result.result || result.tx_hash))
    ).subscribe((result) => {
      fetchWalletInfo$.next(true)

      closeModal$.next(true)
    })
  }
}