import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './Shortcuts.scss'
import { I18n } from './common/I18n'

class Shortcuts extends Component {

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
      <div className="Shortcuts">
        <div 
          onClick={() => window.open(I18n.t('docs.kleva.io'))}
          className="Shortcuts__item"
        >
          {I18n.t('docsShortcut')}
        </div>
        <div 
          onClick={() => window.open('https://medium.com/@KLEVA_Protocol_official')}
          className="Shortcuts__item"
        >
          {I18n.t('mediumShortcut')}
        </div>
      </div>
    )
  }
}

export default Shortcuts