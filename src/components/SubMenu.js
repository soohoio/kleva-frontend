import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './SubMenu.scss'
import LanguageChange from './LanguageChange';
import { I18n } from './common/I18n';

class SubMenu extends Component {

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
      <div className="SubMenu">
        <div className="SubMenu__item SubMenu__item--switch">{I18n.t('wklaySwitch')}</div>
        <div className="SubMenu__item SubMenu__item--guide">{I18n.t('useGuide')}</div>
        <LanguageChange />
      </div>
    )
  }
}

export default SubMenu