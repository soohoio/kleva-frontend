import React, { Component, Fragment, createRef } from 'react'
import BigNumber from 'bignumber.js'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './PriceImpact.scss'
import LabelAndValue from '../LabelAndValue'
import { I18n } from '../common/I18n'
import QuestionMark from '../common/QuestionMark'
import { openModal$ } from '../../streams/ui'
import PriceImpactInfoModal from '../modals/PriceImpactInfoModal'
import { nFormatter, noRounding } from '../../utils/misc'

class PriceImpact extends Component {

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
    const { lossAmount, tokenToSwap, priceImpact } = this.props

    return (
      <LabelAndValue
        className="PriceImpact"
        label={(
          <div className="PriceImpact__label">
            <QuestionMark
              title={I18n.t('lossBySwap')}
              onClick={() => {
                openModal$.next({
                  component: <PriceImpactInfoModal />
                })
              }}
            />
            <p className="PriceImpact__subtitle">{I18n.t('priceImpactWithFee')}</p>
          </div>
        )}
        value={(
          <>
            {tokenToSwap 
              ? (
                <>
                  <p className="PriceImpact__lossAmount">
                    -{noRounding(lossAmount, 4)} {tokenToSwap.title}
                  </p>
                  <p className="PriceImpact__impactRatio PriceImpact__impactRatio--sub">
                    -{new BigNumber(priceImpact).multipliedBy(100).toFixed(2)}%
                  </p>
                </>
              )
              : (
                <>
                  <p className="PriceImpact__impactRatio">
                    -{new BigNumber(priceImpact).multipliedBy(100).toFixed(2)}%
                  </p>
                </>
              )
            }
          </>
        )}
      />
    )
  }
}

export default PriceImpact