import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import Opener from './common/Opener'

import './BorrowingAssetSelector.scss'

class BorrowingAssetSelector extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }
    
  render() {
    const { selected, list, onSelect } = this.props

    const listAttachedBorrowingInterestAPR = list.map((item) => {

      return {
        key: item.address.toLowerCase(),
        ...item,
      }
    })

    return (
      <div 
        className={cx("BorrowingAssetSelector")}
      >
        <Opener
          selectedItem={selected}
          items={listAttachedBorrowingInterestAPR}
          onSelect={onSelect}
        />
      </div>
    )
  }
}

export default BorrowingAssetSelector