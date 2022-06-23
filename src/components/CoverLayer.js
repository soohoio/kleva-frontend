import React, { Component, createRef } from 'react'
import cx from 'classnames'
import { merge, Subject } from 'rxjs'
import { debounceTime, takeUntil, tap } from 'rxjs/operators'

import { modalContentComponent$, overlayBackgroundColor$, openModal$, closeModal$ } from 'streams/ui'

import './CoverLayer.scss'
import { closeLayeredModal$, layeredModalContentComponent$ } from '../streams/ui'

type Props = {

}

class CoverLayer extends Component<Props> {
  destroy$ = new Subject()

  componentDidMount() {
    merge(
      modalContentComponent$,
      layeredModalContentComponent$,
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
          onClick={() => {
            if (layeredModalContentComponent$.value) {
              closeLayeredModal$.next(true)
              return
            }
            closeModal$.next(true)
          }}
        />
        {modalContentComponent$.value}
        {layeredModalContentComponent$.value}
      </div>
    )
  }
}

export default CoverLayer
