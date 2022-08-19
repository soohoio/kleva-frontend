import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import { I18n } from '../common/I18n'
import ThickHR from '../common/ThickHR'

import './Intro3.scss'

class Intro3 extends Component {

  destroy$ = new Subject()

  componentDidMount() {
    merge(
      of(true),
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
      <>
        <div className="Intro3">
          <div className="Intro3__left">
            <p className="Intro3__title">{I18n.t('intro3.title')}</p>
            <p className="Intro3__description">{I18n.t('intro3.description')}</p>
            <p className="Intro3__description2 desktopOnly">{I18n.t('intro3.description2')}</p>
          </div>
          <div className="Intro3__right">
            <img src="/static/images/intro/img_intro_2.png" />
            <p className="Intro3__description2 mobileOnly">{I18n.t('intro3.description2')}</p>
          </div>
        </div>
        <ThickHR size="4" />
      </>
    )
  }
}

export default Intro3