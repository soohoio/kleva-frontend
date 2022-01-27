import { Subject, BehaviorSubject, fromEvent, interval, merge, timer } from 'rxjs'
import { startWith, takeUntil } from 'rxjs/operators'
import { v4 as uuidV4 } from 'uuid'

export const modalContentComponent$ = new BehaviorSubject(null)
export const overlayBackgroundColor$ = new BehaviorSubject(null)
export const disableScreenClose$ = new BehaviorSubject(null)

const DESKTOP_START_WIDTH = 1200

export const isDesktop$ = new BehaviorSubject(window.outerWidth >= DESKTOP_START_WIDTH)

export const isFocused$ = new BehaviorSubject(true)
export const focusChanged$ = new Subject()
export const showFooter$ = new BehaviorSubject(false)

// While touching gauge bar, freeze modal content scroll
export const freezeModalScroll$ = new Subject()
export const unfreezeModalScroll$ = new Subject()


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

openModal$.subscribe(({ component, backgroundColor, disableScreenClose }) => {
  modalContentComponent$.next(component)
  
  if (backgroundColor) {
    overlayBackgroundColor$.next(backgroundColor)
  }
  
  if (disableScreenClose) {
    disableScreenClose$.next(true)
  }
})

closeModal$.subscribe(() => {
  modalContentComponent$.next(null)
  overlayBackgroundColor$.next(null)
  disableScreenClose$.next(null)
})

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