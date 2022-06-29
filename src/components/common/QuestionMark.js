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
    const { info, color, onClick } = this.props
    return (
      <div
        style={{
          color,
          borderColor: color,
        }}
        onClick={onClick}
        className="QuestionMark"
      >
        {info ? 'i' : '?'}
      </div>
    )
  }
}

export default QuestionMark