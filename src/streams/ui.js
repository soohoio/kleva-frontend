import { Subject, BehaviorSubject, fromEvent, interval, merge, timer, of } from 'rxjs'
import { delay, distinctUntilChanged, skip, startWith, switchMap, takeUntil } from 'rxjs/operators'
import { v4 as uuidV4 } from 'uuid'
import { currentTab$ } from './view'
import { browserHistory } from 'react-router'
import { browserHistory$ } from './location'

export const modalContentComponent$ = new BehaviorSubject(null)
export const overlayBackgroundColor$ = new BehaviorSubject(null)
export const disableScreenClose$ = new BehaviorSubject(null)

const DESKTOP_START_WIDTH = 1200

export const isDesktop$ = new BehaviorSubject(window.outerWidth >= DESKTOP_START_WIDTH)

export const isFocused$ = new BehaviorSubject(true)
export const focusChanged$ = new Subject()
export const showFooter$ = new BehaviorSubject(false)
export const isQrCodeModal$ = new BehaviorSubject(false)

// While touching gauge bar, freeze modal content scroll
export const freezeModalScroll$ = new Subject()
export const unfreezeModalScroll$ = new Subject()

// Layered modal
export const openLayeredModal$ = new Subject()
export const closeLayeredModal$ = new Subject()
export const layeredModalContentComponent$ = new BehaviorSubject(null)

// Content View (V2)
export const contentView$ = new BehaviorSubject({})
export const openContentView$ = new Subject()
export const closeContentView$ = new Subject()

openContentView$.subscribe(({ key, component }) => {
  contentView$.next({ key, component })
})

closeContentView$.subscribe(() => {
  contentView$.next(null)
})

openLayeredModal$.subscribe(({ component, classNameAttach }) => {
  if (classNameAttach) {
    classNameAttachLayered$.next(classNameAttach)
  }
  layeredModalContentComponent$.next(component)
})

closeLayeredModal$.subscribe(() => {
  classNameAttachLayered$.next(null)
  layeredModalContentComponent$.next(null)
})


fromEvent(window, 'blur').subscribe(() => {
  isFocused$.next(false)
})

fromEvent(window, 'focus').subscribe(() => {
  isFocused$.next(true)
  focusChanged$.next(true)
})

const checkDesktop = () => {
  const nextValue = window.outerWidth >= DESKTOP_START_WIDTH
  if (isDesktop$.value !== nextValue) {
    isDesktop$.next(nextValue)
  }
}

merge(
  interval(500).pipe(
    startWith(0),
  ),
  fromEvent(window, 'resize'),
).subscribe(checkDesktop)

export const openModal$ = new Subject()

export const closeModal$ = new Subject()

export const classNameAttach$ = new BehaviorSubject()
export const classNameAttachLayered$ = new BehaviorSubject()

openModal$.subscribe(({ component, classNameAttach, backgroundColor, disableScreenClose }) => {
  modalAnimation$.next(null)

  classNameAttach$.next(classNameAttach)
  modalContentComponent$.next(component)

  if (!isDesktop$.value) {
    // mobile animation
    // if (classNameAttach && (classNameAttach !== "Modal--mobileCoverAll")) {
    if (classNameAttach !== "Modal--mobileCoverAll") {
      modalAnimation$.next('appear')
    }
  }
  
  if (backgroundColor) {
    overlayBackgroundColor$.next(backgroundColor)
  }
  if (disableScreenClose) {
    disableScreenClose$.next(true)
  }
})

closeModal$.pipe(
  switchMap(() => {
    // if (!isDesktop$.value && (classNameAttach$.value && (classNameAttach$.value !== "Modal--mobileCoverAll"))) {
    if (!isDesktop$.value && (classNameAttach$.value !== "Modal--mobileCoverAll")) {
      // mobile animation
      modalAnimation$.next('disappear')
      
      return timer(200)
    }

    return of(true)
  }),
).subscribe(() => {
  modalContentComponent$.next(null)
  // modalAnimation$.next(null)
  classNameAttach$.next(null)
  overlayBackgroundColor$.next(null)
  disableScreenClose$.next(null)
  isQrCodeModal$.next(null)
  
  closeLayeredModal$.next(null)
})

export const modalAnimation$ = new BehaviorSubject()

export const pushBanner$ = new Subject()
export const removeBanner$ = new Subject()
export const banners$ = new BehaviorSubject([])

pushBanner$.subscribe(({ key, type, content, duration = 5000 }) => {
  // 'key' also can be set before pushing banner.
  const _key = key || `banner-${uuidV4()}`
  banners$.next([
    ...banners$.value, 
    { key: _key, type, content }
  ])

  timer(duration).subscribe(() => {
    removeBanner$.next({ key: _key })
  })
})

removeBanner$.subscribe(({ key }) => {
  const idx = banners$.value.findIndex((a) => a.key === key)

  const afterRemove = [
    ...banners$.value.slice(0, idx),
    ...banners$.value.slice(idx + 1)
  ]

  banners$.next(afterRemove)
})

currentTab$.pipe(
  skip(1),
).subscribe((tab) => {
  contentView$.next(null)
  
  if (!tab) {
    browserHistory$.next('/')
    // browserHistory.push('/')
    return
  }

  browserHistory$.next(`/main?t=${tab}`)
  // browserHistory.push(`/main?t=${tab}`)
})

export const showStartButton$ = new BehaviorSubject(false)

export const shouldNavigationTabFloat$ = new BehaviorSubject(false)

window.currentTab$ = currentTab$