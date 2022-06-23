import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, BehaviorSubject, interval } from 'rxjs'
import { debounceTime, skip, takeUntil, tap } from 'rxjs/operators'

import './RollingBanner.scss'
import { Tween } from '@tweenjs/tween.js'
import { range, sample } from 'lodash'

const items = [
  {
    href: 'https://bit.ly/3NXDcgN',
    imgSrc: '/static/images/quizevent.banner.png'
  },
  { 
    href: 'https://medium.com/@KLEVA_Protocol_official/the-road-ahead-a72342a62833',
    imgSrc: '/static/images/roadmap.banner.png'
  },
  { 
    href: 'https://medium.com/@KLEVA_Protocol_official/minimize-price-impact-when-opening-a-leveraged-yield-farming-position-248f22da53e1',
    imgSrc: '/static/images/mpi.banner.png'
  },
  {
    href: 'https://docs.kleva.io/',
    imgSrc: '/static/images/marketing1.png'
  },
]

class RollingBanner extends Component {
  $container = new createRef()

  destroy$ = new Subject()

  activeIdx$ = new BehaviorSubject(0)

  componentDidMount() {
    const go$ = new Subject()
    if (this.props.leftRight) {
      window.moveLeftRight$ = go$
    } else {
      window.moveUpDown$ = go$
    }

    merge(
      this.activeIdx$.pipe(
        tap(() => {
          if (this.props.leftRight) {
            this.moveLeftRight()
            return
          }

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

  moveLeftRight = () => {
    if (!this.$container.current) return

    const child = this.$container.current.children[this.activeIdx$.value]
    const { x } = this.$container.current.getBoundingClientRect()

    const nextVal = child.offsetLeft - x
    // const nextVal = childX

    new Tween({ scrollLeft: this.$container.current.scrollLeft })
      .to({ scrollLeft: nextVal })
      .onUpdate((data) => {
        if (!this.$container.current) return
        this.$container.current.scrollLeft = data.scrollLeft
      })
      .start()
  }
    
  render() {
    const { leftRight } = this.props
    
    return (
      <>
        <div ref={this.$container} className={cx("RollingBanner", {
          "RollingBanner--leftRight": leftRight,
        })}>
          {items && items.map(({ href, imgSrc }) => {
            return <img key={imgSrc} onClick={() => window.open(href)} className="RollingBanner__item" src={imgSrc} />
          })}
        </div>
        <div className="RollingBanner__circleList" >
          {range(items.length).map((idx) => {
            return (
              <div onClick={() => this.activeIdx$.next(idx)} key={idx} className={cx("RollingBanner__circle", {
                "RollingBanner__circle--active": idx === this.activeIdx$.value,
              })} />
            )
          })}
        </div>
      </>
    )
  }
}

export default RollingBanner