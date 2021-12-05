import { Subject, BehaviorSubject, forkJoin } from 'rxjs'
import { switchMap } from 'rxjs/operators'
import BigNumber from 'bignumber.js'

import { STRATEGIES } from 'constants/address'
import { addPosition$, approve$, caver, getOutputTokenAmount$, getTransactionReceipt$ } from '../streams/contract'
import { fetchWalletInfo$ } from '../streams/wallet'
import { MAX_UINT } from 'constants/setting'
import { lendingPoolsByStakingTokenAddress } from '../constants/lendingpool'

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
    this.borrowingAmount$ = new BehaviorSubject(0)
    this.farmingTokenAmount$ = new BehaviorSubject('')
    this.baseTokenAmount$ = new BehaviorSubject('')
    this.priceImpact$ = new BehaviorSubject('')
    this.allowances$ = new BehaviorSubject({})
    this.leverage$ = new BehaviorSubject(1)

    // ex) Farming Token: 10 KSP, Base Token: 100 KLEVA
    // Convert 10 KSP to [farmingTokenAmountInBaseToken] KLEVA.
    this.farmingTokenAmountInBaseToken$ = new BehaviorSubject()

    this.fetchAllowances$ = new Subject()
  }

  selectWorker = (borrowingAsset) => {
    const selectedWorker = this.workerList.find((w) => {
      return w.baseToken.address.toLowerCase() === this.borrowingAsset$.value.address.toLowerCase()
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

  calcFarmingTokenAmountInBaseToken = () => {
    getOutputTokenAmount$(
      this.lpToken.address,
      this.farmingToken$.value.address,
      new BigNumber(this.farmingTokenAmount$.value || 0)
        .multipliedBy(10 ** this.farmingToken$.value.decimals)
        .toString(),
    ).subscribe(({ outputAmount, priceImpact }) => {
      this.farmingTokenAmountInBaseToken$.next(outputAmount)
    })
  }

  getPriceImpact = (_poolReserves) => {

    let swapFromToken
    let swapFromTokenAmount
    // FarmingTokenAmount Doesn't exist -> AddBaseTokenOnly
    if (this.farmingTokenAmount$.value == 0) {
      swapFromToken = this.baseToken$.value
      swapFromTokenAmount = new BigNumber(this.baseTokenAmount$.value || 0).multipliedBy(0.5).toString()
      
      getOutputTokenAmount$(
        this.lpToken.address,
        swapFromToken.address,
        new BigNumber(swapFromTokenAmount || 0)
          .multipliedBy(10 ** swapFromToken.decimals)
          .toString(),
      ).subscribe(({ outputAmount, priceImpact }) => {
        this.priceImpact$.next(priceImpact)
        console.log(outputAmount, "outputAmount")
        console.log(priceImpact, "priceImpact")
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

    swapFromTokenAmount = baseAmountWithFarmReserve >= farmAmountWithBaseReserve
      ? this.baseTokenAmount$.value
      : this.farmingTokenAmount$.value

    getOutputTokenAmount$(
      this.lpToken.address,
      swapFromToken.address,
      new BigNumber(swapFromTokenAmount || 0)
        .multipliedBy(10 ** swapFromToken.decimals)
        .toString(),
    ).subscribe(({ outputAmount, priceImpact }) => {
      this.priceImpact$.next(priceImpact)
      console.log(outputAmount, "outputAmount")
      console.log(priceImpact, "priceImpact")
    })
  }

  approve = (token, vaultAddress) => {
    approve$(token.address, vaultAddress, MAX_UINT).pipe(
      switchMap((result) => getTransactionReceipt$(result && result.result))
    ).subscribe((result) => {
      console.log(result, 'approve result')
      fetchWalletInfo$.next(true)

      this.fetchAllowances$.next(true)
    })
  }

  addPosition = () => {
    const { strategyType, strategyAddress } = this.getStrategy()

    // principalAllInBaseToken 
    // == sum(base token amount, convertToBaseTokenAmount(farming token amount))
    const farmingTokenAmountConvertedInBaseToken = this.farmingTokenAmountInBaseToken$.value
    const principalAllInBaseToken = new BigNumber(this.baseTokenAmount$.value)
      .plus(farmingTokenAmountConvertedInBaseToken)
      .toString()

    const borrowAmount = new BigNumber(principalAllInBaseToken)
      .multipliedBy(this.leverage$.value - 1)
      .multipliedBy(10 ** this.baseToken$.value.decimals)
      .toFixed(0)
      
    console.log(borrowAmount, "borrowAmount")

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

    addPosition$(this.worker$.value.vaultAddress, {
      workerAddress: this.worker$.value.workerAddress,
      principalAmount: new BigNumber(this.baseTokenAmount$.value).multipliedBy(10 ** this.baseToken$.value.decimals).toString(),
      borrowAmount, // @TODO
      maxReturn: 0,
      data,
      value: 0,
    }).pipe(
      switchMap((result) => getTransactionReceipt$(result && result.result))
    ).subscribe((result) => {
      console.log(result, 'approve result')
      fetchWalletInfo$.next(true)
    })
  }
}