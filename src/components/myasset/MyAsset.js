import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of, BehaviorSubject } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'
import { I18n } from '../common/I18n'

import { contentView$ } from 'streams/ui'

import MyAssetHeader from './MyAssetHeader'
import ThickHR from '../common/ThickHR'

import './MyAsset.scss'
import Tabs from '../common/Tabs'
import LendNStakeAssetList from './LendNStakeAssetList'
import FarmingAssetList from './FarmingAssetList'

class MyAsset extends Component {
  destroy$ = new Subject()

  // lendnstake, farming
  assetMenu$ = new BehaviorSubject('lendnstake')

  componentDidMount() {
    merge(
      contentView$,
      this.assetMenu$,
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
    if (contentView$.value) {
      return contentView$.value
    }

    if (this.assetMenu$.value === 'lendnstake') {
      return <LendNStakeAssetList />
    }

    return <FarmingAssetList />
  }

  render() {
    return (
      <>
        {!contentView$.value && (
          <>
            <div className="MyAsset__header">
              <MyAssetHeader />
            </div>
            <ThickHR />
          </>
        )}
        <div className="MyAsset__content">
          {!contentView$.value && (
            <>
              <p className="MyAsset__tabsTitle">{I18n.t('myasset.managementDetail')}</p>
              <Tabs
                className="MyAsset__tabs"
                list={[
                  {
                    title: I18n.t('myasset.asset.lendnstake'),
                    onClick: () => this.assetMenu$.next('lendnstake'),
                    isActive: this.assetMenu$.value === 'lendnstake',
                  },
                  {
                    title: I18n.t('myasset.asset.farming'),
                    onClick: () => this.assetMenu$.next('farming'),
                    isActive: this.assetMenu$.value === 'farming',
                  }
                ]}
              />
            </>
          )}
          {this.renderContent()}
        </div>
      </>
      
    )
  }
}

export default MyAsset