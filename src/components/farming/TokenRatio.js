import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './TokenRatio.scss'
import { I18n } from '../common/I18n'
import { noRounding } from '../../utils/misc'

class TokenRatio extends Component {

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

  renderValue = () => {
    let { value1, value2 } = this.props

    value1 = value1 || 0
    value2 = value2 || 0

    const isSum100 = new BigNumber(noRounding(value1, 1)).plus(noRounding(value2, 1)).gte(100)

    if (!isSum100 && value1 != 0) {
      value2 = new BigNumber(100).minus(noRounding(value1, 1)).toNumber()
      return <p className="TokenRatio__value">{noRounding(value1, 1, true)}:{noRounding(value2, 1, true)}</p>
    }

    if (!isSum100 && value2 != 0) {
      value1 = new BigNumber(100).minus(noRounding(value2, 1)).toNumber()
      return <p className="TokenRatio__value">{noRounding(value1, 1, true)}:{noRounding(value2, 1, true)}</p>
    }
    
    return <p className="TokenRatio__value">{noRounding(value1 || 0, 1, true)}:{noRounding(value2 || 0, 1, true)}</p>
  }
    
  render() {
    return (
      <div className="TokenRatio">
        <p className="TokenRatio__title">{I18n.t('tokenRatio')}</p>
        {this.renderValue()}
        <p className="TokenRatio__description">{I18n.t('tokenRatio.description')}</p>
      </div>
    )
  }
}

export default TokenRatio