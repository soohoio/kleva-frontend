import { request, gql } from 'graphql-request'
import { forkJoin, from, Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { farmPool, farmPoolByWorker } from '../constants/farmpool'

export const ITEM_PER_PAGE = 5

// export const GRAPH_NODE_URL = "https://event.nodepelican.com/subgraphs/name/kleva"
export const GRAPH_NODE_URL = "https://rm5darpzya.execute-api.ap-northeast-2.amazonaws.com/default/defi-kleva-endpoint"

export const getPositions$ = (owner, page = 1, first, skip) => {

  return from(
    fetch(`${GRAPH_NODE_URL}?method=live&owner=${owner}&first=${first}&skip=${skip || 0}&orderBy=latestBlockTime&orderDirection=desc`)
    .then((res) => res.json())
    .catch(() => {
      return { positions: [] }
    })
  ).pipe(
    map(({ positions }) => {
      return positions
        .filter((item) => {
          const _farm = farmPoolByWorker[item.workerAddress] || farmPoolByWorker[item.workerAddress.toLowerCase()]

          // Invalid or Deprecated worker
          return !!_farm
        })
        .map((item) => {
          const _farm = farmPoolByWorker[item.workerAddress] || farmPoolByWorker[item.workerAddress.toLowerCase()]

          return { ...item, ..._farm }
      })
    })
  )
}

export const getKilledPositions$ = (owner, page = 1, first, skip) => {

  return from(
    fetch(`${GRAPH_NODE_URL}?method=kill&owner=${owner}&first=${first}&skip=${skip || 0}&orderBy=latestBlockTime&orderDirection=desc`)
      .then((res) => res.json())
      .catch(() => {
        return { positions: [] }
      })
  ).pipe(
    map(({ positions }) => {
      return positions
        .filter((item) => {
          const _farm = farmPoolByWorker[item.workerAddress] || farmPoolByWorker[item.workerAddress.toLowerCase()]

          // Invalid or Deprecated worker
          return !!_farm
        })
        .map((item) => {
          const _farm = farmPoolByWorker[item.workerAddress] || farmPoolByWorker[item.workerAddress.toLowerCase()]

          return { ...item, ..._farm }
        })
    })
  )
}

export const getPositionsAll$ = (owner) => {

  return forkJoin([
    getPositions$(owner, 0, 1000),
    getKilledPositions$(owner, 0, 1000),
  ]).pipe(
      map(([positions, killedPositions]) => {

        return [
          ...positions,
          ...killedPositions,
        ]
          .filter((item) => {
            const _farm = farmPoolByWorker[item.workerAddress] || farmPoolByWorker[item.workerAddress.toLowerCase()]

            // Invalid or Deprecated worker
            return !!_farm
          })
          .map((item) => {
            const _farm = farmPoolByWorker[item.workerAddress] || farmPoolByWorker[item.workerAddress.toLowerCase()]

            return { ...item, ..._farm }
          })
      })
    )
}

