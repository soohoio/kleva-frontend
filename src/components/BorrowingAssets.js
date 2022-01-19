import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import Opener from 'components/common/Opener'

import './BorrowingAssets.scss'

class BorrowingAssets extends Component {
  destroy$ = new Subject()

  componentDidMount() {
    
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }
    
  render() {
    const { items, selectedItem, onSelect } = this.props
    
    return (
      <div className="BorrowingAssets">
        <p className="BorrowingAssets__title">Borrowing Assets</p>
        <Opener
          items={items}
          selectedItem={selectedItem}
          onSelect={onSelect}
        />
      </div>
    )
  }
}

export default BorrowingAssets