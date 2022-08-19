import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import { I18n } from '../common/I18n'

import './Intro7.scss'

class Intro7 extends Component {

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
      <div className="Intro7">
        <p>{I18n.t('intro7.title')}</p>
        <button>{I18n.t('intro7.see')}</button>
      </div>
    )
  }
}

export default Intro7