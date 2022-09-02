import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './Videos.scss'
import { VideoItem } from '../intro/Intro5'

import { I18n } from 'components/common/I18n'
import { closeModal$ } from '../../streams/ui'
import { currentTab$ } from '../../streams/view'

class Videos extends Component {

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
    const { sectionTitle } = this.props
    
    return (
      <div className="Videos">
        <p className="Videos__sectionTitle">{sectionTitle}</p>
        <div className="Videos__content">
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

export default Videos