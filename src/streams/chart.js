import fetch from "node-fetch"
import { BehaviorSubject, forkJoin, from, of } from "rxjs"
import { catchError, map, switchMap } from "rxjs/operators"
import { dummyItems } from "../components/dashboard/dummy"

export const chartData$ = new BehaviorSubject({
  total_tvl: [],
  lending_tvl: [],
  farming_tvl: [],
  kleva_totalsupply: [],
  kleva_circulation: [],
  kleva_platform_locked: [],
  kleva_buybackburn_fund: [],
  kleva_burn: [],
})

export const burnHistoryData$ = new BehaviorSubject({
  data: [],
  accumValue: "0",
})

const yesterday = new Date(Date.now() - 864e5)

const chartDate = `${new Date().getFullYear()}_${String(new Date().getMonth() + 1).padStart(2, "0")}_${String(new Date().getDate()).padStart(2, "0")}`
const chartBackupDate = `${new Date().getFullYear()}_${String(yesterday.getMonth() + 1).padStart(2, "0")}_${String(yesterday.getDate()).padStart(2, "0")}`

const CHART_FETCH_URL = `https://wt-mars-share.s3.ap-northeast-2.amazonaws.com/KLEVA_${chartDate}.json`
const CHART_BACKUP_FETCH_URL = `https://wt-mars-share.s3.ap-northeast-2.amazonaws.com/KLEVA_${chartBackupDate}.json`

const BURN_HISTORY_API_URL = "https://275dmnyh53.execute-api.ap-southeast-1.amazonaws.com/dev/data"

export const fetchChartData$ = () => {
  return forkJoin([
    from(fetch(CHART_FETCH_URL)).pipe(
      switchMap((res) => res.json()),
      catchError((err) => {
        console.log(err, '@err')
        return of(null)
      })
    ),
    from(fetch(CHART_BACKUP_FETCH_URL)).pipe(
      switchMap((res) => res.json()),
      catchError(() => of(null))
    )
  ]).pipe(
    map(([data, backupData]) => {

      if (!data) {
        data = backupData
      }

      if (!data && !backupData) {
        data = dummyItems
      }

      return data
        .sort((a, b) => new Date(a.bdate).getTime() - new Date(b.bdate).getTime())
        .reduce((acc, {
          bdate,
          total_tvl,
          lending_tvl,
          farming_tvl,
          kleva_totalsupply,
          kleva_circulation,
          kleva_platform_locked,
          kleva_buybackburn_fund,
          kleva_burn,
        }) => {
          const date = new Date(bdate.replace("'", ''))

          acc.total_tvl.push({ date, value: total_tvl })
          acc.lending_tvl.push({ date, value: lending_tvl })
          acc.farming_tvl.push({ date, value: farming_tvl })
          acc.kleva_totalsupply.push({ date, value: kleva_totalsupply })
          acc.kleva_circulation.push({ date, value: kleva_circulation })
          acc.kleva_platform_locked.push({ date, value: kleva_platform_locked })
          acc.kleva_buybackburn_fund.push({ date, value: kleva_buybackburn_fund })
          acc.kleva_burn.push({ date, value: kleva_burn })

          return acc

        }, {
          total_tvl: [],
          lending_tvl: [],
          farming_tvl: [],
          kleva_totalsupply: [],
          kleva_circulation: [],
          kleva_platform_locked: [],
          kleva_buybackburn_fund: [],
          kleva_burn: [],
        })
    })
  )
}

export const getBurnHistory$ = () => {
  return from(fetch(BURN_HISTORY_API_URL)).pipe(
    switchMap((res) => res.json()),
    catchError(() => of(null)),
    map(({ data, accumValue }) => {
      return {
        data: data.reverse(),
        accumValue,
      }
    })
  )
}