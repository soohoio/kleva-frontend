import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './Intro4.scss'
import { I18n } from '../common/I18n'
import ThickHR from '../common/ThickHR'

class Intro4 extends Component {

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
        <div className="Intro4">
          <div className="Intro4__left">
            <p className="Intro4__title mobileOnly">{I18n.t('intro4.title')}</p>
            <p className="Intro4__description mobileOnly">{I18n.t('intro4.description')}</p>
            <div className="Intro4__imageWrapper">
              <img src="/static/images/intro/img_intro_3.png?date=20220929" />
              <p className="Intro4__description2 mobileOnly">{I18n.t('intro4.description2')}</p>
            </div>
          </div>
          <div className="Intro4__right">
            <p className="Intro4__title desktopOnly">{I18n.t('intro4.title')}</p>
            <p className="Intro4__description desktopOnly">{I18n.t('intro4.description')}</p>
            <p className="Intro4__description2 desktopOnly">{I18n.t('intro4.description2')}</p>
          </div>
        </div>
        <ThickHR size="4" />
      </>
    )
  }
}

export default Intro4