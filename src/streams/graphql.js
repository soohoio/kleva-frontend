import { request, gql } from 'graphql-request'
import { from, Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { farmPool, farmPoolByWorker } from '../constants/farmpool'

export const GRAPH_NODE_URL = "http://13.213.38.24:8000/subgraphs/name/kleva"

export const getPositions$ = (owner, page = 1) => {

  return from(
    request(
    GRAPH_NODE_URL,
    gql`
      query($first: Int!, $skip: Int!, $where: Position_filter) {
        positions(where: $where) {
          id,
          owner,
          borrowAmount,
          principalAmount,
          workerAddress
        }
      }
    `,
    { 
      first: 10,
      skip: 10 * (page - 1),
      where: { owner } 
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
