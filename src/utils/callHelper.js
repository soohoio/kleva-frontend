import BigNumber from 'bignumber.js'
import { flatten } from "lodash"

export const showParamsOnCall = (callInfoList, params) => {
  const r = flatten(callInfoList).reduce((acc, cur, idx) => {
    acc.buf[params[idx % params.length]] = (cur && cur._hex && new BigNumber(cur._hex).toString()) || cur

    const shouldPush = (idx % params.length) === params.length - 1

    if (shouldPush) {
      acc.result.push({ ...acc.buf })

      acc.buf = {}

      return acc
    }

    return acc
  }, {
    buf: {},
    result: [],
  })

  return r.result
}