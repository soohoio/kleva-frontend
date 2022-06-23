import { Subject, BehaviorSubject } from 'rxjs'
import { tap, map, share, startWith } from 'rxjs/operators'

import i18nMap from 'constants/i18n'
import { getFirstBrowserLanguage } from 'utils/misc'

const recommendedLanguage = (() => {

  const localeInLocalStorage = localStorage.getItem('locale')

  if (localeInLocalStorage) {
    return i18nMap[localeInLocalStorage] ? localeInLocalStorage : 'en'
  }

  const fbl = getFirstBrowserLanguage()

  const _recommended = fbl && fbl.split('-')[0]

  return i18nMap[_recommended] ? _recommended : 'en'

})().split('-')[0]

export const currentLocale$ = new BehaviorSubject(recommendedLanguage)
export const localeMap$ = new BehaviorSubject(i18nMap[recommendedLanguage])

export const localeChange$ = new Subject().pipe(
  tap(({ locale }) => {
    currentLocale$.next(locale)
    localeMap$.next(i18nMap[locale])
  }),
  map(({ locale }) => locale),
  tap((locale) => {
    localStorage.setItem('locale', locale)
  }),
  share(),
)

export const localeTitleMap$ = new BehaviorSubject({
  'ko': '한국어',
  'en': 'English',
  'zh': '繁體中文',
  'ja': '日本語',
})

localeChange$.subscribe()
localeChange$.next({ locale: recommendedLanguage })

localeMap$.subscribe()


window.localeChange$ = localeChange$