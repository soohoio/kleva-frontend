import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import Dropdown from './common/Dropdown'

import './BorrowingAssetSelector.scss'

class BorrowingAssetSelector extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    
  }
  
  componentWillUnMount() {
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
      <div className="BorrowingAssetSelector">
        <Dropdown
          selectedItem={selected}
          items={listAttachedBorrowingInterestAPR}
          onSelect={onSelect}
        />
      </div>
    )
  }
}

export default BorrowingAssetSelector