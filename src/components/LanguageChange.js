import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './LanguageChange.scss'
import { localeChange$, currentLocale$ } from 'streams/i18n';
import { BehaviorSubject } from 'rxjs';
import Dropdown from './common/Dropdown';

const LANGUAGES = [
  { title: '한국어', value: 'ko' },
  { title: 'English', value: 'en' },
]

class LanguageChange extends Component {

  destroy$ = new Subject()
  selectedItem$ = new BehaviorSubject()
  
  componentDidMount() {
    merge(
      of(true),
    ).pipe(
      debounceTime(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })
    
    const selectedItem = LANGUAGES.find((item) => item.value == currentLocale$.value)
    this.selectedItem$.next(selectedItem)
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }
    
  render() {
    const { upper } = this.props
    return (
      <div className="LanguageChange">
        <Dropdown
          upper={upper}
          selectedItem$={this.selectedItem$}
          items={LANGUAGES}
          onSelect={(item) => {
            localeChange$.next({ locale: item.value })
            this.selectedItem$.next(item)
          }}
        />
      </div>
    )
  }
}

export default LanguageChange