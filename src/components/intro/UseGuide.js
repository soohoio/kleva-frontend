import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import { I18n } from '../common/I18n'
import { VideoItem } from 'components/intro/Intro5'

import './UseGuide.scss'

import { currentTab$ } from '../../streams/view'
import { closeModal$ } from '../../streams/ui'
import { prevLocation$ } from '../../streams/location'
import { getQS } from '../../utils/misc'

class UseGuide extends Component {

  destroy$ = new Subject()

  componentDidMount() {
    merge(
      currentTab$,
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
      <div className="UseGuide">
        <div className="UseGuideHeader">
          <p className="UseGuideHeader__title">
            {I18n.t('useGuide')}
            <img
              onClick={() => {
                const prevQs = getQS(prevLocation$.value)
                if (prevLocation$.value && prevQs?.t) {
                  currentTab$.next(prevQs?.t)
                  return
                }
                currentTab$.next('myasset')
              }}
              className="UseGuideHeader__close"
              src="/static/images/exported/x.svg"
            />
          </p>
        </div>
        <div className="UseGuide__content">
          <VideoItem
            imgSrc="/static/images/intro/tutorial_thum_1.png"
            title={I18n.t('intro5.video1.title')}
            description={I18n.t('intro5.video1.description')}
          />
          <VideoItem
            className="VideoItem--2"
            imgSrc="/static/images/intro/tutorial_thum_2.png"
            title={I18n.t('intro5.video2.title')}
            description={I18n.t('intro5.video2.description')}
            subtitle={I18n.t('tag.novice')}
            action={(
              <div onClick={() => {
                closeModal$.next(true)
                currentTab$.next('lendnstake')
              }} className="VideoItem__action">
                {I18n.t('guide.emptyManagedAsset.buttoneTitle1')}
              </div>
            )}
          />
          <VideoItem
            className="VideoItem--3"
            imgSrc="/static/images/intro/tutorial_thum_3.png"
            title={I18n.t('intro5.video3.title')}
            description={I18n.t('intro5.video3.description')}
            subtitle={I18n.t('tag.highProfit')}
            action={(
              <div onClick={() => {
                closeModal$.next(true)
                currentTab$.next('farming')
              }} className="VideoItem__action">
                {I18n.t('guide.emptyManagedAsset.buttoneTitle2')}
              </div>
            )}
          />
        </div>
      </div>
    )
  }
}

export default UseGuide