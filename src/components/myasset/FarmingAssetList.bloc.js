import { BehaviorSubject, Subject, forkJoin } from 'rxjs'
import { takeUntil, tap, switchMap, map } from 'rxjs/operators'

import { getOriginalTokenFromIbToken, ibTokenByAddress, ibTokens, lpTokenByAddress, tokenList } from '../../constants/tokens'
import { balancesInStakingPool$, balancesInWallet$, selectedAddress$ } from '../../streams/wallet'
import { tokenPrices$ } from '../../streams/tokenPrice'
import { lendingTokenSupplyInfo$, poolAmountInStakingPool$ } from '../../streams/vault'
import { klevaAnnualRewards$, protocolAPR$ } from '../../streams/farming'
import { stakingPoolsByToken } from '../../constants/stakingpool'
import { PROTOCOL_FEE } from '../../constants/lendingpool'
import { isSameAddress } from '../../utils/misc'
import { getPositions$, getPositionsAll$ } from '../../streams/graphql'

export default class {
  constructor(comp) {
    this.comp = comp

    this.farmingPositionValueMap$ = new BehaviorSubject({})
  }

  getFarmingAssetValue = () => {
    const farmingPositionValues = Object.entries(this.farmingPositionValueMap$.value).reduce((acc, [address, farmingPositionValueInUSD]) => {
      const lpToken = lpTokenByAddress[address]
      const title = `${lpToken.ingredients[0].title}+${lpToken.ingredients[1].title}`

      if (farmingPositionValueInUSD == 0) return acc

      acc.push({
        title,
        balanceTotalInUSD: farmingPositionValueInUSD
      })

      return acc
    }, [])

    const totalInUSD = farmingPositionValues.reduce((acc, cur) => {
      return new BigNumber(acc).plus(cur.balanceTotalInUSD).toNumber()
    }, 0)

    const sorted = farmingPositionValues.sort((a, b) => {
      const _a = new BigNumber(a.balanceTotalInUSD).toNumber()
      const _b = new BigNumber(b.balanceTotalInUSD).toNumber()

      return _b - _a
    })

    return {
      sorted,
      farmingPositionValues,
      totalInUSD,
    }
  }
}
