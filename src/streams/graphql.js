import { request, gql } from 'graphql-request'
import { from, Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { farmPool, farmPoolByWorker } from '../constants/farmpool'

export const ITEM_PER_PAGE = 5

export const GRAPH_NODE_URL = "http://13.213.38.24:8000/subgraphs/name/kleva2"

export const getUserPositionSummary$ = (owner) => {
  return from(
    request(
      GRAPH_NODE_URL,
      gql`
      query($id: ID!) {
        userPositionSummary(id: $id) {
          id,
          livePositionCount,
          killedPositionCount,
        }
      }
    `, {
      id: String(owner).toLowerCase(),
    })).pipe(
      map(({ userPositionSummary }) => {
        return userPositionSummary
      })
    )
}

export const getPositions$ = (owner, page = 1) => {

  return from(
    request(
    GRAPH_NODE_URL,
    gql`
      query($first: Int!, $skip: Int!, $where: Position_filter) {
        positions(
            first: $first, 
            skip: $skip, 
            where: $where, 
            orderBy: id, 
            orderDirection: desc
        ) {
          id,
          positionId,
          owner,
          workerAddress,
          lpShare,
          debtShare,
          debtAmount,
          latestBlockTime,
          
          positionValueAtKilled,
          debtAtKilled,
          restAmountAtKilled,
          prizeAtKilled,
          killedTx,
        }
      }
    `,
    { 
      first: ITEM_PER_PAGE,
      skip: Math.max(0, ITEM_PER_PAGE * (page - 1)),
      where: { owner, lpShare_gt: 0 },
    }
  )).pipe(
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

export const getKilledPositions$ = (owner, page = 1) => {

  return from(
    request(
      GRAPH_NODE_URL,
      gql`
      query($first: Int!, $skip: Int!, $where: Position_filter) {
        positions(
            first: $first, 
            skip: $skip, 
            where: $where, 
            orderBy: id, 
            orderDirection: desc
        ) {
          id,
          positionId,
          owner,
          workerAddress,
          lpShare,
          debtShare,
          debtAmount,
          latestBlockTime,

          positionValueAtKilled,
          debtAtKilled,
          prizeAtKilled,
          restAmountAtKilled,
          killedTx,
        }
      }
    `,
      {
        first: ITEM_PER_PAGE,
        skip: Math.max(0, ITEM_PER_PAGE * (page - 1)),
        where: { owner, killed: true },
      }
    )).pipe(
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