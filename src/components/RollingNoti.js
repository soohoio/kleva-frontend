import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, BehaviorSubject, interval } from 'rxjs'
import { debounceTime, skip, takeUntil, tap } from 'rxjs/operators'

import './RollingNoti.scss'
import { Tween } from '@tweenjs/tween.js'
import { range, sample } from 'lodash'
import { I18n } from './common/I18n'

const items = [
  {
    category: 'notice', 
    content: 'notice.1',
    href: 'https://bit.ly/3NXDcgN',
  },
  {
    category: 'notice', 
    content: 'wklaySwitch',
    href: 'https://bit.ly/3NXDcgN',
  },
]

class RollingNoti extends Component {
  $container = new createRef()

  destroy$ = new Subject()

  activeIdx$ = new BehaviorSubject(0)

  componentDidMount() {
    const go$ = new Subject()
    window.moveUpDown$ = go$

    merge(
      this.activeIdx$.pipe(
        tap(() => {
          this.moveUpDown()
        })
      ),
    ).pipe(
      debounceTime(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })

    merge(
      go$,
      interval(5000),
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {

      if (this.activeIdx$.value + 1 >= items.length) {
        // this.activeIdx$.next(this.activeIdx$.value - 1)
        this.activeIdx$.next(0)
        return
      }

      this.activeIdx$.next(this.activeIdx$.value + 1)
    })
  }

  componentWillUnmount() {
    this.destroy$.next(true)
  }

  moveUpDown = () => {
    if (!this.$container.current) return

    const child = this.$container.current.children[this.activeIdx$.value]
    const { top } = this.$container.current.getBoundingClientRect()

    const nextVal = child.offsetTop - top

    new Tween({ scrollTop: this.$container.current.scrollTop })
      .to({ scrollTop: nextVal })
      .onUpdate((data) => {
        if (!this.$container.current) return
        this.$container.current.scrollTop = data.scrollTop
      })
      .start()
  }

  render() {
    return (
      <>
        <div ref={this.$container} className={cx("RollingNoti")}>
          {items && items.map(({ category, content, href, imgSrc }) => {
            return <div
              onClick={() => {
                if (href) {
                  window.open(href)
                }
              }}
              className="RollingNoti__item"
            >
              <span className="RollingNoti__itemCategory">{I18n.t(category)}</span>
              <span 
                className="RollingNoti__itemContent"
              >
                {I18n.t(content)}
              </span>
            </div>
          })}
        </div>
      </>
    )
  }
}

export default RollingNoti