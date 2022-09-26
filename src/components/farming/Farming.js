import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'
import { I18n } from '../common/I18n'
import FarmList from './FarmList'

import { contentView$ } from 'streams/ui'

import './Farming.scss'

class Farming extends Component {
  destroy$ = new Subject()

  componentDidMount() {
    merge(
      contentView$,
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
      <div className={cx("Farming", {
        [`Farming--contentView`]: !!contentView$.value?.component,
      })}>
        <div className="Farming__intro">
          <p className="Farming__introTitle">
            {I18n.t('farming.intro.title')}
          </p>
          <p className="Farming__introDescription">
            {I18n.t('farming.intro.description')}
          </p>
          <p 
            onClick={() => {
              window.open(I18n.t('href.video.3'))
            }}
            className="Farming__introMisc"
          >
            {I18n.t('farming.intro.misc')}
          </p>
        </div>
        <div className="Farming__list">
          {contentView$.value?.component || <FarmList />}
        </div>
      </div>
    )
  }
}

export default Farming