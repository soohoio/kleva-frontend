import { BehaviorSubject, Subject } from "rxjs"
import { browserHistory } from 'react-router'

export const path$ = new BehaviorSubject(window.location.pathname)
export const browserHistory$ = new Subject()

export const prevLocation$ = new BehaviorSubject()

window.browserHistory$ = browserHistory$

browserHistory$.subscribe((path) => {
  prevLocation$.next({...window.location})
  browserHistory.push(path)
})