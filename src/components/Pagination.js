import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import './Pagination.scss'

class Pagination extends Component {
  destroy$ = new Subject()
  
  componentDidMount() {
    
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }
    
  render() {
    const { currentPage, lastPage, nextAvailable, prevAvailable, onNext, onPrev } = this.props
    
    return (
      <div className="Pagination">
        <div
          className="Pagination__prev"
          onClick={() => {
            if (prevAvailable) {
              onPrev()
            }
          }}
        >
          <img src="/static/images/arrow-left.svg?date=20220929" />
        </div>
        <div className="Pagination__page">
          <span className="Pagination__currentPage">{currentPage}</span>
          <span>/ {lastPage}</span>
        </div>
        <div 
          className="Pagination__next"
          onClick={() => {
            if (nextAvailable) {
              onNext()
            }
          }}
        >
          <img src="/static/images/arrow-right.svg?date=20220929" />
        </div>
      </div>
    )
  }
}

export default Pagination