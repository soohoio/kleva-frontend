import fetch from "node-fetch"
import { BehaviorSubject, forkJoin, from, of } from "rxjs"
import { catchError, map, retry, switchMap } from "rxjs/operators"
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

const BURN_HISTORY_API_URL = "https://kleva-data.s3.ap-northeast-2.amazonaws.com/burn-history.json"

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
    catchError(() => of({
      "data": [
        {
          "date": "2022.05.26",
          "burnedKLEVA": "277,430.37",
          "burnedInUSD": "156,886.87",
          "txid": "0x535e6893befd3be14b65385e261be91e8dd9df7044bf7b0a2faf3af8707fbea1"
        },
        {
          "date": "2022.05.27",
          "burnedKLEVA": "98,328.03",
          "burnedInUSD": "52,035.19",
          "txid": "0x0e06f662fb82ec91eefbe45098040aeb975aff1f20dd8dbc79371122dfbd2f1b"
        },
        {
          "date": "2022.07.05",
          "burnedKLEVA": "328,849.83",
          "burnedInUSD": "52,813.28",
          "txid": "0x72fd9bcec93702a213aa700224f6b0160ba96adfd8ef3e14399cf04a24715e94"
        },
        {
          "date": "2022.08.02",
          "burnedKLEVA": "175,194.85",
          "burnedInUSD": "45,988.65",
          "txid": "0x702ac1507c8bfa50582dc2027f0ba74599fbd05efe0df82d52692c12d81b8fc4"
        },
        {
          "date": "2022.09.02",
          "burnedKLEVA": "190,893.89",
          "burnedInUSD": "34,723.60",
          "txid": "0x5f95ddb24d5412365c4ec1084aca496f52d3def1002a748de10625e5a3f3b6f2"
        },
        {
          "date": "2022.10.05",
          "burnedKLEVA": "382,401.78",
          "burnedInUSD": "50,782.96",
          "txid": "0xb33d6d91dbabba5d08007fb3c10219b4273f3f20a8b8b3cd6132d72742a7cc2c"
        },
        {
          "date": "2022.11.25",
          "burnedKLEVA": "2,708,196.70",
          "burnedInUSD": "175,889.97",
          "txid": "0xce88a3c2de579fd206a654bc0dd10ec039eb93432fa75b5ede12418ae799dbbb"
        },
        {
          "date": "2023.01.17",
          "burnedKLEVA": "889,035.52",
          "burnedInUSD": "78,893.01",
          "txid": "0xc5c23f91d2ca656462c57ccbc7baafda62461e314c38ced8016fbddbac1e3fe5"
        },
        {
          "date": "2023.02.08",
          "burnedKLEVA": "125,901.21",
          "burnedInUSD": "15,196.28",
          "txid": "0x7fe3025f20c2ab3dda20699eea303fd17bcb832d689875012a1cd019efe8cfd8"
        }
      ],
      "accumValue": "663,210"
    })),
    retry(10),
    map((result) => {
      return {
        data: result && result.data && result.data.reverse(),
        accumValue: result && result.accumValue,
      }
    })
  )
}