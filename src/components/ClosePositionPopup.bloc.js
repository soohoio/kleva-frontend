import { BehaviorSubject } from 'rxjs'
import { switchMap, tap } from 'rxjs/operators'
import BigNumber from 'bignumber.js'

import { STRATEGIES } from '../constants/address'
import { caver, convertToBaseToken$, getPartialCloseMinimizeResult$, getTransactionReceipt$, minimizeTrading$, partialCloseLiquidate$, partialMinimizeTrading$ } from '../streams/contract'
import { fetchWalletInfo$ } from '../streams/wallet'
import { closeModal$ } from '../streams/ui'
import { fetchPositions$, klevaAnnualRewards$ } from '../streams/farming'
import { calcKlevaRewardsAPR, getEachTokenBasedOnLPShare } from '../utils/calc'
import { tokenPrices$ } from '../streams/tokenPrice'
import { lendingTokenSupplyInfo$ } from '../streams/vault'
import { tokenList, debtTokens } from '../constants/tokens'

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

    this.isLoading$ = new BehaviorSubject()

    this.farmingTokenAmount$ = new BehaviorSubject('')
    this.baseTokenAmount$ = new BehaviorSubject('')
    this.farmingTokenAmountInBaseToken$ = new BehaviorSubject('')

    this.positionValue$ = new BehaviorSubject()
    this.equityValue$ = new BehaviorSubject()
    this.debtValue$ = new BehaviorSubject()

    this.newPositionValue$ = new BehaviorSubject()
    this.newDebtValue$ = new BehaviorSubject()
    this.liquidationThreshold$ = new BehaviorSubject()
    this.currentPositionLeverage$ = new BehaviorSubject()
    this.finalCalculatedLeverage$ = new BehaviorSubject()

    // Based on lp share / lp total supply
    this.lpToken$ = new BehaviorSubject()
    this.lpShare$ = new BehaviorSubject()
    this.lpAmount$ = new BehaviorSubject()
    this.userFarmingTokenAmount$ = new BehaviorSubject()
    this.userBaseTokenAmount$ = new BehaviorSubject()

    this.newUserFarmingTokenAmount$ = new BehaviorSubject()
    this.newUserBaseTokenAmount$ = new BehaviorSubject()

    this.health$ = new BehaviorSubject()

    this.closingMethod$ = new BehaviorSubject('minimizeTrading')

    this.entirelyClose$ = new BehaviorSubject(true)
    this.partialCloseAvailable$ = new BehaviorSubject(false)

    // Partial
    this.partialCloseRatio$ = new BehaviorSubject(0)
    this.repayDebtRatio$ = new BehaviorSubject(0)
    this.debtRepaymentAmount$ = new BehaviorSubject(0)
    this.repayPercentageLimit$ = new BehaviorSubject()

    this.priceImpact$ = new BehaviorSubject()
    this.amountToTrade$ = new BehaviorSubject()

    // Listen from summary components
    this.listenedOutputAmount$ = new BehaviorSubject()
    this.listenedAmountToTrade$ = new BehaviorSubject()

    // DEV
    window.partialCloseRatio$ = this.partialCloseRatio$
  }

  closePosition = () => {
    // Entire Close
    if (this.entirelyClose$.value) {
      if (this.closingMethod$.value === "convertToBaseToken") {
        this.convertToBaseToken()
        return
      }

      if (this.closingMethod$.value === "minimizeTrading") {
        this.minimizeTrading()
        return
      }
    }

    // Partial Close
    if (this.closingMethod$.value === "convertToBaseToken") {
      console.log("partialConvertToBaseToken")
      this.partialConvertToBaseToken()
      return
    }

    if (this.closingMethod$.value === "minimizeTrading") {
      console.log("partialMinimizeTrading")
      this.partialMinimizeTrading()
      return
    }
  }

  convertToBaseToken = () => {
    const strategyAddress = STRATEGIES["LIQUIDATE_STRATEGY"]

    const convertedPositionValue = new BigNumber(this.userBaseTokenAmount$.value)
      .multipliedBy(10 ** this.baseToken.decimals)
      .plus(new BigNumber(this.listenedOutputAmount$.value))
      .toNumber()

    const youWillReceiveBaseTokenAmount = new BigNumber(convertedPositionValue)
      .minus(new BigNumber(this.debtValue$.value).multipliedBy(10 ** this.baseToken.decimals))
      .toFixed(0)

    const MIN_BASE_TOKEN_AMOUNT = new BigNumber(youWillReceiveBaseTokenAmount).multipliedBy(0.9).toFixed(0)

    const ext = caver.klay.abi.encodeParameters(['uint256'], [MIN_BASE_TOKEN_AMOUNT])
    const data = caver.klay.abi.encodeParameters(['address', 'bytes'], [strategyAddress, ext])

    convertToBaseToken$(this.vaultAddress, {
      positionId: this.positionId,
      data,
    }).pipe(
      tap(() => this.isLoading$.next(true)),
      switchMap((result) => getTransactionReceipt$(result && result.result || result.tx_hash))
    ).subscribe((result) => {
      fetchWalletInfo$.next(true)
      this.isLoading$.next(false)
      fetchPositions$.next(true)
      closeModal$.next(true)
    })
  }

  minimizeTrading = () => {
    const strategyAddress = STRATEGIES["MINIMIZE_TRADING_STRATEGY"]

    const youWillReceiveFarmingTokenAmount = new BigNumber(this.userFarmingTokenAmount$.value)
      .multipliedBy(10 ** this.farmingToken.decimals)
      .minus(this.listenedAmountToTrade$.value)
      .toNumber()

    const MIN_FARMING_TOKEN_AMOUNT = new BigNumber(youWillReceiveFarmingTokenAmount).multipliedBy(0.9).toFixed(0)

    const ext = caver.klay.abi.encodeParameters(['uint256'], [MIN_FARMING_TOKEN_AMOUNT])
    const data = caver.klay.abi.encodeParameters(
      ['address', 'bytes'],
      [strategyAddress, ext]
    )

    minimizeTrading$(this.vaultAddress, {
      positionId: this.positionId,
      data,
    }).pipe(
      tap(() => this.isLoading$.next(true)),
      switchMap((result) => getTransactionReceipt$(result && result.result || result.tx_hash))
    ).subscribe((result) => {
      fetchWalletInfo$.next(true)
      fetchPositions$.next(true)
      this.isLoading$.next(false)
      closeModal$.next(true)
    })
  }

  partialConvertToBaseToken = () => {
    const strategyAddress = STRATEGIES["PARTIAL_LIQUIDATE_STRATEGY"]

    const MAX_LP_TOKEN_TO_LIQUIDATE = new BigNumber(this.lpAmount$.value)
      .multipliedBy(this.partialCloseRatio$.value / 100)
      .toFixed(0)

    const MAX_DEBT_REPAYMENT = new BigNumber(this.debtRepaymentAmount$.value)
      .toFixed(0)

    getPartialCloseMinimizeResult$({
      workerAddress: this.workerInfo.workerAddress,
      positionId: this.positionId,
      closedLpAmt: MAX_LP_TOKEN_TO_LIQUIDATE,
      debtToRepay: MAX_DEBT_REPAYMENT,
    }).pipe(
      switchMap(({
        receiveBaseTokenAmt,
        receiveFarmTokenAmt,
      }) => {

        const MIN_BASE_TOKEN_AMOUNT = new BigNumber(receiveBaseTokenAmt).multipliedBy(0.9).toFixed(0)

        const ext = caver.klay.abi.encodeParameters(['uint256', 'uint256', 'uint256'], [
          MAX_LP_TOKEN_TO_LIQUIDATE,
          MAX_DEBT_REPAYMENT,
          MIN_BASE_TOKEN_AMOUNT,
        ])
        const data = caver.klay.abi.encodeParameters(['address', 'bytes'], [strategyAddress, ext])

        return partialCloseLiquidate$(this.vaultAddress, {
          positionId: this.positionId,
          maxDebtRepayment: MAX_DEBT_REPAYMENT,
          data,
        }).pipe(
          tap(() => this.isLoading$.next(true)),
          switchMap((result) => getTransactionReceipt$(result && result.result || result.tx_hash))
        )
      })
    ).subscribe(() => {
      this.isLoading$.next(false)
      fetchWalletInfo$.next(true)
      closeModal$.next(true)
      fetchPositions$.next(true)
    })
  }

  partialMinimizeTrading = () => {
    const strategyAddress = STRATEGIES["PARTIAL_MINIMIZE_TRADING_STRATEGY"]

    const MAX_LP_TOKEN_TO_LIQUIDATE = new BigNumber(this.lpAmount$.value)
      .multipliedBy(this.partialCloseRatio$.value / 100)
      .toFixed(0)

    const MAX_DEBT_REPAYMENT = new BigNumber(this.debtRepaymentAmount$.value)
      .toFixed(0)

    getPartialCloseMinimizeResult$({
      workerAddress: this.workerInfo.workerAddress,
      positionId: this.positionId,
      closedLpAmt: MAX_LP_TOKEN_TO_LIQUIDATE,
      debtToRepay: MAX_DEBT_REPAYMENT,
    }).pipe(
      switchMap(({
        receiveBaseTokenAmt,
        receiveFarmTokenAmt,
      }) => {
        const MIN_FARMING_TOKEN_AMOUNT = new BigNumber(receiveFarmTokenAmt).multipliedBy(0.9).toFixed(0)
        console.log(MIN_FARMING_TOKEN_AMOUNT, 'MIN_FARMING_TOKEN_AMOUNT')

        const ext = caver.klay.abi.encodeParameters(['uint256', 'uint256', 'uint256'], [
          MAX_LP_TOKEN_TO_LIQUIDATE,
          MAX_DEBT_REPAYMENT,
          MIN_FARMING_TOKEN_AMOUNT,
        ])

        const data = caver.klay.abi.encodeParameters(['address', 'bytes'], [strategyAddress, ext])

        return partialMinimizeTrading$(this.vaultAddress, {
          positionId: this.positionId,
          maxDebtRepayment: MAX_DEBT_REPAYMENT,
          data,
        }).pipe(
          tap(() => this.isLoading$.next(true)),
          switchMap((result) => getTransactionReceipt$(result && result.result || result.tx_hash))
        )
      })
    ).subscribe(() => {
      this.isLoading$.next(false)
      fetchWalletInfo$.next(true)
      closeModal$.next(true)
      fetchPositions$.next(true)
    })


    // partialMinimizeTrading$(this.vaultAddress, {
    //   positionId: this.positionId,
    //   maxDebtRepayment: MAX_DEBT_REPAYMENT,
    //   data,
    // }).pipe(
    //   tap(() => this.isLoading$.next(true)),
    //   switchMap((result) => getTransactionReceipt$(result && result.result || result.tx_hash))
    // ).subscribe((result) => {
    //   this.isLoading$.next(false)
    //   fetchWalletInfo$.next(true)
    //   closeModal$.next(true)
    //   fetchPositions$.next(true)
    // })
  }

  getDebtTokenKlevaRewardsAPR = (leverage) => {
    const lendingTokenSupplyInfo = lendingTokenSupplyInfo$.value
    const borrowingAsset = this.baseToken

    return calcKlevaRewardsAPR({
      tokenPrices: tokenPrices$.value,
      lendingTokenSupplyInfo,
      borrowingAsset,
      debtTokens,
      klevaAnnualRewards: klevaAnnualRewards$.value,
      klevaTokenPrice: tokenPrices$.value[tokenList.KLEVA.address.toLowerCase()],
      leverage,
    })
  }

  getBeforeAfterValues = ({
    yieldFarmingAPRBefore,
    tradingFeeAPRBefore,
    klevaRewardsAPRBefore,
    borrowingInterestAPRBefore,
  }) => {

    const finalLeverageValue = this.finalCalculatedLeverage$.value

    const before_totalAPR = new BigNumber(yieldFarmingAPRBefore)
      .plus(tradingFeeAPRBefore)
      .plus(klevaRewardsAPRBefore) // klevaRewards
      .minus(borrowingInterestAPRBefore) // borrowingInterest
      .toNumber()

    const before_debtRatio = new BigNumber(this.debtValue$.value)
      .div(this.positionValue$.value)
      .multipliedBy(100)
      .toNumber()

    const before_safetyBuffer = new BigNumber(this.liquidationThreshold$.value)
      .minus(before_debtRatio)
      .toNumber()

    const after_debtRatio = new BigNumber(this.newDebtValue$.value)
      .div(this.newPositionValue$.value)
      .multipliedBy(100)
      .toNumber()

    const after_safetyBuffer = new BigNumber(this.liquidationThreshold$.value)
      .minus(after_debtRatio)
      .toNumber()

    const after_yieldFarmingAPR = new BigNumber(yieldFarmingAPRBefore)
      .multipliedBy(finalLeverageValue)
      .div(this.currentPositionLeverage$.value)
      .toNumber()

    const after_tradingFeeAPR = new BigNumber(tradingFeeAPRBefore)
      .multipliedBy(finalLeverageValue)
      .div(this.currentPositionLeverage$.value)
      .toNumber()

    const after_klevaRewardsAPR = this.getDebtTokenKlevaRewardsAPR(finalLeverageValue)

    const after_borrowingInterestAPR = new BigNumber(borrowingInterestAPRBefore)
      .multipliedBy(finalLeverageValue - 1)
      .div(this.currentPositionLeverage$.value - 1)
      .toNumber()

    const after_totalAPR = new BigNumber(after_yieldFarmingAPR)
      .plus(after_tradingFeeAPR)
      .plus(after_klevaRewardsAPR) // klevaRewards
      .minus(after_borrowingInterestAPR) // borrowingInterest
      .toNumber()

    return {
      before_totalAPR,
      before_debtRatio,
      before_safetyBuffer,
      after_debtRatio,
      after_safetyBuffer,
      after_yieldFarmingAPR,
      after_tradingFeeAPR,
      after_klevaRewardsAPR,
      after_borrowingInterestAPR,
      after_totalAPR,
    }
  }
}