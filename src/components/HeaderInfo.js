import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import LYFPrice from './LYFPrice'
import TVL from './TVL'

import './HeaderInfo.scss'

class HeaderInfo extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }
    
  render() {
    
    return (
      <div className="HeaderInfo">
        <LYFPrice />
        <div className="HeaderInfo__liner" />
        <TVL />
      </div>
    )
  }
}

export default HeaderInfo