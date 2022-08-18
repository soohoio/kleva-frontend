import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { BehaviorSubject, Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './QuestionMark.scss'
import Tip from './Tip'

class QuestionMark extends Component {
  destroy$ = new Subject()
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }
    
  render() {
    const { title, info, color, onClick } = this.props

    if (title) {
      return (
        <div className="QuestionMark__wrapper">
          {title && <span className="QuestionMark__title">{title}</span>}
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
        </div>
      )
    }

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