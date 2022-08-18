import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'
import { I18n } from '../common/I18n'

import { contentView$ } from 'streams/ui'

import MyAssetHeader from './MyAssetHeader'
import ThickHR from '../common/ThickHR'

import './MyAsset.scss'

class MyAsset extends Component {
  destroy$ = new Subject()

  componentDidMount() {
    merge(
      contentView$,
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
      <>
        <div className="MyAsset__header">
          <MyAssetHeader />
        </div>
        <ThickHR />
      </>
      
    )
  }
}

export default MyAsset

// {/* <div className={cx("MyAsset", {
//           [`MyAsset--contentView`]: !!contentView$.value,
//         })}>
          
//           {/* <div className="MyAsset__content">
//             {contentView$.value || }
//           </div> */}
//         </div> */}