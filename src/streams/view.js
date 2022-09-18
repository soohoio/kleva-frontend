import { BehaviorSubject } from "rxjs"
import { getQS } from "../utils/misc"

const qs = getQS()
export const currentTab$ = new BehaviorSubject(qs?.t || '')