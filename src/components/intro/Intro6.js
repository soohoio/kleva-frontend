import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './Intro6.scss'
import { I18n } from '../common/I18n'

const QuoteItem = ({ imgSrc, title, subtitle, description }) => {
  return (
    <div className="QuoteItem">
      <div className="QuoteItem__header">
        <img className="QuoteItem__image" src={imgSrc} />
        <div className="QuoteItem__titleWrapper">
          <p className="QuoteItem__title">{title}</p>
          <p className="QuoteItem__subtitle">{subtitle}</p>
        </div>
      </div>
      <p className="QuoteItem__description">{description}</p>
      <button className="QuoteItem__see">{I18n.t('intro6.see')}</button>
    </div>
  )
}

class Intro6 extends Component {

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
      <div className="Intro6">
        <p className="Intro6__title">{I18n.t('intro6.title')}</p>
        <div className="Intro6__content">
          <QuoteItem
            imgSrc="/static/images/intro/intro_profile_1.png"
            title={I18n.t('intro6.quote1.title')}
            subtitle={I18n.t('intro6.quote1.subtitle')}
            description={I18n.t('intro6.quote1.description')}
          />
          <QuoteItem
            imgSrc="/static/images/intro/intro_profile_2.png"
            title={I18n.t('intro6.quote2.title')}
            subtitle={I18n.t('intro6.quote2.subtitle')}
            description={I18n.t('intro6.quote2.description')}
          />
          <QuoteItem
            imgSrc="/static/images/intro/intro_profile_3.png"
            title={I18n.t('intro6.quote3.title')}
            subtitle={I18n.t('intro6.quote3.subtitle')}
            description={I18n.t('intro6.quote3.description')}
          />
        </div>
      </div>
    )
  }
}

export default Intro6