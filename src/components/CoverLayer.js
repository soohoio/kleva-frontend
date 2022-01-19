import React, { Component, createRef } from 'react'
import cx from 'classnames'
import { Subject } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import { modalContentComponent$, overlayBackgroundColor$, openModal$, closeModal$ } from 'streams/ui'

import './CoverLayer.scss'

type Props = {

}

class CoverLayer extends Component<Props> {
  destroy$ = new Subject()

  componentDidMount() {
    modalContentComponent$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })
  }

  componentWillUnmount() {
    this.destroy$.next(true)
  }

  render() {
    return (
      <div
        className={cx('CoverLayer__wrapper', {
          'CoverLayer__wrapper--hide': !modalContentComponent$.value,
        })}
      >
        <div
          style={{ backgroundColor: overlayBackgroundColor$.value }}
          ref={this.$overlay}
          className="CoverLayer"
          onClick={() => closeModal$.next(true)}
        />
        {modalContentComponent$.value}
      </div>
    )
  }
}

export default CoverLayer
