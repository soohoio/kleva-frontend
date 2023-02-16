import fetch from "node-fetch"
import { BehaviorSubject, forkJoin, from, of } from "rxjs"
import { catchError, map, retry, switchMap } from "rxjs/operators"

const NOTICE_API_URL = "https://275dmnyh53.execute-api.ap-southeast-1.amazonaws.com/dev/notice"

export const getNotices$ = () => {
  return from(fetch(NOTICE_API_URL)).pipe(
    switchMap((res) => res.json()),
    catchError(() => of({
      "data": [
        {
          "ko": "KLEVA 토큰 상장 예정 안내 (지닥)",
          "en": "$KLEVA will be listed on GDAC",
          "href": "https://medium.com/@KLEVA_Protocol_official/f1ee7d17fea6"
        },
        {
          "ko": "KLEVA 토큰 9차 바이백&소각 안내",
          "en": "KLEVA Buyback & Burn #9",
          "href": "https://medium.com/@KLEVA_Protocol_official/f7bf334b06a3"
        },
        {
          "ko": "KLEVA 멤버십을 소개합니다.",
          "en": "Product Update: KLEVA Membership",
          "href": "https://medium.com/@KLEVA_Protocol_official/4ae8361417cc"
        },
        {
          "ko": "KLEVA 토큰 상장 안내 (PROBIT GLOBAL)",
          "en": "$KLEVA will be listed on PROBIT GLOBAL",
          "href": "https://medium.com/@KLEVA_Protocol_official/282382ffdd1b"
        },
        {
          "ko": "2023년 1월 커뮤니티 리포트",
          "en": "Community Report: January, 2023",
          "href": "https://medium.com/@KLEVA_Protocol_official/8b3d08f4de23"
        }
      ]
    })),
    retry(10),
    map((result) => {
      return result && result.data || []
    })
  )
}

export const noticeItems$ = new BehaviorSubject([])