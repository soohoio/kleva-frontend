import { tokenList } from '../constants/tokens'
import { farmPool } from '../constants/farmpool'
import { workers } from '../constants/workers'
import { workerInfo$ } from '../streams/farming'
import { FAIRLAUNCH } from '../constants/address'
import { lendingPools } from '../constants/lendingpool'

export const extractJSON = () => {
  return {
    workerInfo: Object.entries(workerInfo$.value).reduce((acc, [workerAddress, item]) => {
      if (acc[workerAddress] || acc[workerAddress.toLowerCase()]) {
        return acc
      }

      acc[workerAddress] = item
      return acc

    }, {}),
    tokenList,
    farmPool,
    workers,
    lendingPools,
    address: {
      FAIRLAUNCH,
    }
  }
}

window.extractJSON = extractJSON