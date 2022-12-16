import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './PoolTokenRatioBeforeAfter.scss'
import { nFormatter } from '../../utils/misc'
import { I18n } from '../common/I18n'

class PoolTokenRatioBeforeAfter extends Component {

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
    const { list } = this.props
    return (
      <div className="PoolTokenRatioBeforeAfter">
        <p className="PoolTokenRatioBeforeAfter__title">{I18n.t('poolTokenRatio.after')}</p>
        {list.map(({ token, tokenRatio, tokenRatioAfter }) => {
          return (
            <div className="PoolTokenRatioBeforeAfter__item">
              <div>
                <img src={token.iconSrc} className="PoolTokenRatioBeforeAfter__itemImage" />
                <span className="PoolTokenRatioBeforeAfter__itemTitle">{token.title}</span>
              </div>
              <div>
                <span className="PoolTokenRatioBeforeAfter__ratioBefore">{tokenRatio?.toFixed(2)}%</span>
                <img className="PoolTokenBeforeAfter__arrow" src="/static/images/arrow-right2.svg" />
                <span className="PoolTokenRatioBeforeAfter__ratioAfter">{tokenRatioAfter?.toFixed(2)}%</span>
              </div>
            </div>
          )
        })}
      </div>
    )
  }
}

export default PoolTokenRatioBeforeAfter