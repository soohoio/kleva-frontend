import { BehaviorSubject } from "rxjs"

export const path$ = new BehaviorSubject(window.location.pathname)