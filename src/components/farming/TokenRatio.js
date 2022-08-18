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
    
  render() {
    const { value1, value2 } = this.props

    return (
      <div className="TokenRatio">
        <p className="TokenRatio__title">{I18n.t('tokenRatio')}</p>
        <p className="TokenRatio__value">{noRounding(value1 || 0, 1)}:{noRounding(value2 || 0, 1)}</p>
        <p className="TokenRatio__description">{I18n.t('tokenRatio.description')}</p>
      </div>
    )
  }
}

export default TokenRatio