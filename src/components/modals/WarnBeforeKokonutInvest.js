import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import Modal from '../common/Modal'
import { I18n } from '../common/I18n'
import CompletedModal from '../common/CompletedModal'
import { closeModal$ } from '../../streams/ui'

import "./WarnBeforeKokonutInvest.scss"

class WarnBeforeKokonutInvest extends Component {

  destroy$ = new Subject()

  componentDidMount() {

  }

  componentWillUnmount() {
    this.destroy$.next(true)
  }

  render() {
    return (
      <CompletedModal
        className="WarnBeforeKokonutInvest" 
        menus={[
            {
              title: I18n.t('confirm'),
              onClick: () => {
                closeModal$.next(true)
              }
            },
          ]}
        >
          <p className="CompletedModal__title">{I18n.t('warnBeforeKokonutInvest.title')}</p>
          <p className="WarnBeforeKokonutInvest__description1">{I18n.t('warnBeforeKokonutInvest.description1')}</p>
          <p className="WarnBeforeKokonutInvest__description2">{I18n.t('warnBeforeKokonutInvest.description2')}</p>
        </CompletedModal>
    )
  }
}

export default WarnBeforeKokonutInvest