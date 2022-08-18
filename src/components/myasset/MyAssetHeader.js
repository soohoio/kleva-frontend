import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './MyAssetHeader.scss'
import ClaimableKLEVA from './ClaimableKLEVA'
import ManagementAsset from './ManagementAsset'

class MyAssetHeader extends Component {

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
      <div className="MyAssetHeader">
        <ManagementAsset />
        <ClaimableKLEVA />
      </div>
    )
  }
}

export default MyAssetHeader