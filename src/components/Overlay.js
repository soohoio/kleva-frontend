import React, { Component, createRef } from 'react'
import cx from 'classnames'
import { Subject } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import { modalContentComponent$, overlayBackgroundColor$, openModal$, closeModal$ } from 'streams/ui'

import './Overlay.scss'

type Props = {

}

class Overlay extends Component<Props> {
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
        className={cx('Overlay__wrapper', {
          'Overlay__wrapper--hide': !modalContentComponent$.value,
        })}
      >
        <div
          style={{ backgroundColor: overlayBackgroundColor$.value }}
          ref={this.$overlay}
          className="Overlay"
          onClick={() => closeModal$.next(true)}
        />
        {modalContentComponent$.value}
      </div>
    )
  }
}

export default Overlay
