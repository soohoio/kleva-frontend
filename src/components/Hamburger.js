import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import MobileGNB from 'components/MobileGNB'
import { openModal$ } from 'streams/ui'

import './Hamburger.scss'

class Hamburger extends Component {
  destroy$ = new Subject()

  componentDidMount() {

  }

  componentWillUnmount() {
    this.destroy$.next(true)
  }

  render() {

    return (
      <img
        className="Hamburger"
        onClick={() => openModal$.next({
          component: <MobileGNB />,
        })}
        src="/static/images/icon-gnb.svg?date=20220929"
      />
    )
  }
}

export default Hamburger