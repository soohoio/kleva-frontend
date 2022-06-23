import { Subject, from, of, defer } from 'rxjs'
import { map, mergeMap, retry, catchError } from 'rxjs/operators'

const ajaxOptions = {
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  credentials: 'include',
}

export const API_URL = process.env.API_URL

export const ajax$ = (fullpath, method = 'GET', body, options) => {

  if (method === 'POST') {
    return defer(() => from(fetch(fullpath, {
      ...Object.assign({}, ajaxOptions, options),
      method: 'POST',
      body: JSON.stringify(body),
    }))).pipe(
      mergeMap(res => res.json()),
      retry(2),
      catchError((error) => {
        return of({
          error,
        })
      })
    )
  }

  return defer(() => from(fetch(fullpath, {
      ...Object.assign({}, ajaxOptions, options),
      method: 'GET',
    }))).pipe(
    mergeMap(res => res.json()),
    retry(2),
    catchError((error) => {
      return of({
        error,
      })
    })
  )
}
