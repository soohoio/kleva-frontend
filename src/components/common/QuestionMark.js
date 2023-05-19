import React, { Component, Fragment, createRef } from 'react'
import { twMerge } from 'tailwind-merge'
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
    const { title, size, info, color, transparent, onClick, className } = this.props
    let { backgroundImage } = this.props

    backgroundImage = backgroundImage || (transparent 
      ? "question-mark-transparent"
      : info 
        ? "infomark"
        : "questionmark"
    )

    if (title) {
      return (
        <div className="QuestionMark__wrapper">
          {title && <span className="QuestionMark__title">{title}</span>}
          <div
            style={{
              color,
              fontSize: size,
              borderColor: color,
              backgroundImage: `url(/static/images/exported/${backgroundImage}.svg?date=20220929`
            }}
            onClick={onClick}
            className="QuestionMark bg-no-repeat"
        />
        </div>
      )
    }

    return (
      <div
        style={{
          color,
          fontSize: size,
          borderColor: color,
          backgroundImage: `url(/static/images/exported/${backgroundImage}.svg?date=20220929`
        }}
        onClick={onClick}
        className={twMerge(
          "QuestionMark bg-no-repeat",
          className
        )}
      />
    )
  }
}

export default QuestionMark