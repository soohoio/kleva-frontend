import React, { cloneElement, Component, createRef } from 'react'
import cx from 'classnames'
import { merge, Subject } from 'rxjs'
import { debounceTime, takeUntil, tap } from 'rxjs/operators'

import { modalContentComponent$, overlayBackgroundColor$, openModal$, closeModal$ } from 'streams/ui'

import './CoverLayer.scss'
import { closeLayeredModal$, layeredModalContentComponent$, modalAnimation$ } from '../streams/ui'

type Props = {

}

class CoverLayer extends Component<Props> {
  destroy$ = new Subject()

  componentDidMount() {
    merge(
      modalContentComponent$,
      layeredModalContentComponent$,
      modalAnimation$,
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
          [`CoverLayer__wrapper--animation-${modalAnimation$.value}`]: true,
          'CoverLayer__wrapper--hide': !modalContentComponent$.value,
          'CoverLayer__wrapper--layered': !!layeredModalContentComponent$.value,
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
        {!!layeredModalContentComponent$.value && cloneElement(layeredModalContentComponent$.value, { layered: true })}
      </div>
    )
  }
}

export default CoverLayer
