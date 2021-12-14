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
    const { selected, list, borrowingInterestsAPR } = this.props

    const listAttachedBorrowingInterestAPR = list.map((item) => {

      const interest = borrowingInterestsAPR[item.address.toLowerCase()]

      return {
        ...item,
        // title: `${item.title} -${Number(interest).toLocaleString('en-us', { maximumFractionDigits: 2 })}%`,
        // borrowingInterestAPR: Number(interest).toLocaleString('en-us', { maximumFractionDigits: 2 })
      }
    })

    return (
      <div className="BorrowingAssetSelector">
        <Dropdown
          selectedItem={selected}
          items={listAttachedBorrowingInterestAPR}
        />
      </div>
    )
  }
}

export default BorrowingAssetSelector