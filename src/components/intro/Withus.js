import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './Withus.scss'

import { currentTab$ } from '../../streams/view'

const WithusItem = ({ href, imgSrc }) => {
  return (
    <div 
      onClick={() => window.open(href)}
      className="WithusItem"
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
                currentTab$.next('myasset')
              }}
              className="WithusHeader__close"
              src="/static/images/exported/x.svg"
            />
          </p>
        </div>
        <div className="Withus__content">
          <p className="Withus__category">Developers</p>
          <div className="Withus__items">
            <WithusItem
              href="https://wemixnetwork.com/"
              imgSrc="/static/images/exported/withus-wemix.svg"
            />
            <WithusItem
              href="https://www.sooho.io/"
              imgSrc="/static/images/exported/withus-sooho.svg"
            />
            <WithusItem
              href="https://birkosully.com/"
              imgSrc="/static/images/exported/withus-birkosully.svg"
            />
          </div>
          <p className="Withus__category">Partners</p>
          <div className="Withus__items">
            <WithusItem
              href="https://klayfi.finance/"
              imgSrc="/static/images/exported/withus-klayfi.svg"
            />
            <WithusItem
              href="https://claimswap.org/"
              imgSrc="/static/images/exported/withus-claimswap.svg"
            />
            <WithusItem
              href="https://kokoa.finance/"
              imgSrc="/static/images/exported/withus-kokoa.svg"
            />
            <WithusItem
              href="https://klaytn.domains/"
              imgSrc="/static/images/exported/withus-kns.svg"
            />
            <WithusItem
              href="https://kokonutswap.finance/"
              imgSrc="/static/images/exported/withus-kokonut.svg"
            />
          </div>
          <p className="Withus__category">Audit</p>
          <div className="Withus__items">
            <WithusItem
              href="https://peckshield.com/"
              imgSrc="/static/images/exported/withus-peckshield.svg"
            />
            <WithusItem
              href="https://scvsoft.net/"
              imgSrc="/static/images/exported/withus-scvsoft.svg"
            />
            <WithusItem
              href="https://audit.sooho.io/"
              imgSrc="/static/images/exported/withus-sooho-audit.svg"
            />
            <WithusItem
              href="https://www.slowmist.com/"
              imgSrc="/static/images/exported/withus-slowmist.svg"
            />
            <WithusItem
              href="https://hacken.io/"
              imgSrc="/static/images/exported/withus-hacken.svg"
            />
          </div>
        </div>
      </div>
    )
  }
}

export default Withus