import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './Withus.scss'

import { currentTab$ } from '../../streams/view'
import { backPage, getQS } from '../../utils/misc'
import { prevLocation$ } from '../../streams/location'

const WithusItem = ({ className, href, imgSrc }) => {
  return (
    <div 
      onClick={() => window.open(href)}
      className={cx("WithusItem", className)}
    >
      <img className="WithusItem__image" src={imgSrc} />
    </div>
  )
}

class Withus extends Component {

  destroy$ = new Subject()

  componentDidMount() {
    merge(
      currentTab$,
    ).pipe(
      debounceTime(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })
  }

  componentWillUnmount() {
    this.destroy$.next(true)
  }

  render() {

    return (
      <div className="Withus">
        <div className="WithusHeader">
          <p className="WithusHeader__title">
            With Us
            <img
              onClick={() => {
                backPage()
              }}
              className="WithusHeader__close"
              src="/static/images/exported/x.svg?date=20220929"
            />
          </p>
        </div>
        <div className="Withus__content">
          <p className="Withus__category">Developers</p>
          <div className="Withus__items">
            <WithusItem
              href="https://wemixnetwork.com/"
              imgSrc="/static/images/exported/withus-wemix.svg?date=20221013"
            />
            <WithusItem
              className="WithusItem--sooho"
              href="https://www.sooho.io/"
              imgSrc="/static/images/exported/withus-sooho.png?date=20221012"
            />
            <WithusItem
              href="https://birkosully.com/"
              imgSrc="/static/images/exported/withus-birkosully.svg?date=20220929"
            />
          </div>
          <p className="Withus__category">Partners</p>
          <div className="Withus__items">
            <WithusItem
              href="https://klayfi.finance/"
              imgSrc="/static/images/exported/withus-klayfi.svg?date=20220929"
            />
            <WithusItem
              href="https://claimswap.org/"
              imgSrc="/static/images/exported/withus-claimswap.png?date=20220929"
            />
            <WithusItem
              href="https://kokoa.finance/"
              imgSrc="/static/images/exported/withus-kokoa.png?date=20220929"
            />
            <WithusItem
              href="https://klaytn.domains/"
              imgSrc="/static/images/exported/withus-kns.svg?date=20220929"
            />
            <WithusItem
              href="https://kokonutswap.finance/"
              imgSrc="/static/images/exported/withus-kokonut.png?date=20220929"
            />
          </div>
          <p className="Withus__category">Audit</p>
          <div className="Withus__items">
            <WithusItem
              href="https://peckshield.com/"
              imgSrc="/static/images/exported/withus-peckshield.svg?date=20220929"
            />
            <WithusItem
              href="https://scvsoft.net/"
              imgSrc="/static/images/exported/withus-scvsoft.png?date=20220929"
            />
            <WithusItem
              className="WithusItem--sooho"
              href="https://audit.sooho.io/"
              imgSrc="/static/images/exported/withus-sooho.png?date=20221012"
            />
            <WithusItem
              href="https://www.slowmist.com/"
              imgSrc="/static/images/exported/withus-slowmist.png?date=20220929"
            />
            <WithusItem
              href="https://hacken.io/"
              imgSrc="/static/images/exported/withus-hacken.svg?date=20220929"
            />
          </div>
        </div>
      </div>
    )
  }
}

export default Withus