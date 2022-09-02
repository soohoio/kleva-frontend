import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of, BehaviorSubject } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import WKLAYSwitcher from 'components/common/WKLAYSwitcher'

import './WKLAYSwitchModal.scss'
import Modal from '../common/Modal'
import { I18n } from '../common/I18n'
import { balancesInWallet$ } from '../../streams/wallet'
import Tabs from '../common/Tabs'

class WKLAYSwitchModal extends Component {

  destroy$ = new Subject()
  mode$ = new BehaviorSubject('toklay')
  
  componentDidMount() {
    merge(
      this.mode$,
      balancesInWallet$,
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

  renderContent = () => {
    if (this.mode$.value === 'toklay') {
      return (
        <WKLAYSwitcher
          toKLAY
          column
          balancesInWallet={balancesInWallet$.value}
        />
      )
    }
    
    if (this.mode$.value === 'towklay') {
      return (
        <WKLAYSwitcher
          column
          balancesInWallet={balancesInWallet$.value}
        />
      )
    }
  }
    
  render() {
    return (
      <Modal 
        className="WKLAYSwitchModal Modal--mobileCoverAll"
        title={I18n.t('wklaySwitch')}
      >
        <p className="WKLAYSwitchModal__description">{I18n.t('wklaySwitch.description')}</p>
        <Tabs
          className="ClosePosition__tabs"
          list={[
            {
              title: I18n.t('wklaySwitch.toKLAY'),
              onClick: () => this.mode$.next('toklay'),
              isActive: this.mode$.value === 'toklay',
            },
            {
              title: I18n.t('wklaySwitch.toWKLAY'),
              onClick: () => this.mode$.next('towklay'),
              isActive: this.mode$.value === 'towklay',
            }
          ]}
        />
        {this.renderContent()}
      </Modal>
    )
  }
}

export default WKLAYSwitchModal