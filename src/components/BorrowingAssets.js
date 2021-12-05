import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import Dropdown from 'components/common/Dropdown'

import './BorrowingAssets.scss'

class BorrowingAssets extends Component {
  destroy$ = new Subject()

  componentDidMount() {
    
  }
  
  componentWillUnMount() {
    this.destroy$.next(true)
  }
    
  render() {
    const { items, selectedItem, onSelect } = this.props
    
    return (
      <div className="BorrowingAssets">
        <p className="BorrowingAssets__title">Borrowing Assets</p>
        <Dropdown
          noSearch
          items={items}
          selectedItem={selectedItem}
          onSelect={onSelect}
        />
      </div>
    )
  }
}

export default BorrowingAssets