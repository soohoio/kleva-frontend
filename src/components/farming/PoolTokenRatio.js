import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './PoolTokenRatio.scss'
import { nFormatter } from '../../utils/misc'
import { I18n } from '../common/I18n'

class PoolTokenRatio extends Component {

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
    const { list, lpToken, className } = this.props
    return (
      <div className={cx("PoolTokenRatio", className)}>
        <p className="PoolTokenRatio__title">{I18n.t('poolTokenRatio', { title: lpToken.title })}</p>
        {list.map(({ token, valueInUSD, tokenRatio }) => {
          return (
            <div className="PoolTokenRatio__item">
              <div>
                <img src={token.iconSrc} className="PoolTokenRatio__itemImage" />
                <span className="PoolTokenRatio__itemTitle">{token.title}</span>
              </div>
              <div>
                <span className="PoolTokenRatio__valueInUSD">${nFormatter(valueInUSD)} </span>
                <span className="PoolTokenRatio__ratio">{tokenRatio?.toFixed(2)}%</span>
              </div>
            </div>
          )
        })}
        <p className="PoolTokenRatio__description">{I18n.t('poolTokenRatio.description')}</p>
      </div>
    )
  }
}

export default PoolTokenRatio