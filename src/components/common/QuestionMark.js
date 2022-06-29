import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './QuestionMark.scss'

class QuestionMark extends Component {

  destroy$ = new Subject()
  
  componentDidMount() {

  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }
    
  render() {
    const { onClick } = this.props
    return (
      <div
        onClick={onClick}
        className="QuestionMark"
      >
        ?
      </div>
    )
  }
}

export default QuestionMark