import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './Boosted.scss'
import QuestionMark from './common/QuestionMark'
import { openModal$ } from '../streams/ui'
import BoostInfoModal from './modals/BoostInfoModal'
import { noRounding } from '../utils/misc'
import { getBufferedLeverage } from '../utils/calc'

class Boosted extends Component {

  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      of(true),
    ).pipe(
      debounceTime(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })
    
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }
    
  render() {
    const { workerConfig, description } = this.props

    return (
      <div 
        className="Boosted"
      >
        <img src="/static/images/exported/boosted.svg" />
        <QuestionMark
          onClick={() => {
            openModal$.next({
              component: (
                <BoostInfoModal
                  workerConfig={workerConfig}
                />
              )
            })
          }}
        />
        {!!description && <span className="Boosted__description">{description}</span>}
      </div>
    )
  }
}

export default Boosted