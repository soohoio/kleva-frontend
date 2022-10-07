import fetch from "node-fetch"
import { BehaviorSubject, forkJoin, from, of } from "rxjs"
import { catchError, map, switchMap } from "rxjs/operators"

const NOTICE_API_URL = "https://275dmnyh53.execute-api.ap-southeast-1.amazonaws.com/dev/notice"

export const getNotices$ = () => {
  return from(fetch(NOTICE_API_URL)).pipe(
    switchMap((res) => res.json()),
    catchError(() => of(null)),
    map(({ data }) => {
      return data
    })
  )
}

export const noticeItems$ = new BehaviorSubject([])