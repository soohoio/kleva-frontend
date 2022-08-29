import fetch from "node-fetch"
import { BehaviorSubject, from, of } from "rxjs"
import { map } from "rxjs/operators"
import { dummyItems } from "../components/dashboard/dummy"

const initialChartData = {
  total_tvl: [],
  lending_tvl: [],
  farming_tvl: [],
  kleva_totalsupply: [],
  kleva_circulation: [],
  kleva_platform_locked: [],
}

export const chartData$ = new BehaviorSubject(initialChartData)

const CHART_FETCH_URL = "https://wt-mars-share.s3.ap-northeast-2.amazonaws.com/KLEVA_2022_08_16.json"

export const fetchChartData$ = () => {
  return of(
    dummyItems
  ).pipe(
    map((data) => {

      console.log(data, 'data')

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
        }) => {
          const date = new Date(bdate)

          acc.total_tvl.push({ date, value: total_tvl })
          acc.lending_tvl.push({ date, value: lending_tvl })
          acc.farming_tvl.push({ date, value: farming_tvl })
          acc.kleva_totalsupply.push({ date, value: kleva_totalsupply })
          acc.kleva_circulation.push({ date, value: kleva_circulation })
          acc.kleva_platform_locked.push({ date, value: kleva_platform_locked })

          return acc

      }, initialChartData)
    })
  )
}