import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import FarmSummaryItem from './FarmSummaryItem'

import './APRAPYBrief.scss'
import { toAPY } from '../utils/calc'
import BeforeAfter from './BeforeAfter'
import Checkbox from './common/Checkbox'

class APRAPYBrief extends Component {
  destroy$ = new Subject()

  componentDidMount() {
    
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }
    
  render() {
    const { totalAPRBefore, totalAPRAfter, showDetail$ } = this.props

    return (
      <div className="APRAPYBrief__wrapper">
        <div className="APRAPYBrief">
          <FarmSummaryItem
            className="APRAPYBrief__apy"
            left="Total APY"
            right={(
              <BeforeAfter
                before={`${nFormatter(toAPY(totalAPRBefore), 2)}%`}
                after={`${nFormatter(toAPY(totalAPRAfter), 2)}%`}
              />
            )}
          />
          <FarmSummaryItem
            className="APRAPYBrief__apr"
            left="Total APR"
            right={(
              <BeforeAfter
                before={`${nFormatter(totalAPRBefore, 2)}%`}
                after={`${nFormatter(totalAPRAfter, 2)}%`}
              />
            )}
          />
        </div>
        <Checkbox
          label="Detailed"
          checked$={showDetail$}
        />
      </div>
    )
  }
}

export default APRAPYBrief