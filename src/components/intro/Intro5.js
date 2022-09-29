import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './Intro5.scss'
import { I18n } from '../common/I18n'

export const VideoItem = ({ href, className, imgSrc, title, subtitle, description, action }) => {
  return (
    <div className={cx("VideoItem", className)}>
      <div 
        onClick={() => {
          window.open(href)
        }}
        className="VideoItem__imageWrapper"
      >
        <img className="VideoItem__image" src={imgSrc} />
      </div>
      <p className="VideoItem__title">
        {title}
        {subtitle && <span className="VideoItem__subtitle">{subtitle}</span>}
      </p>
      <p className="VideoItem__description">{description}</p>
      {!!action && action}
    </div>
  )
}

class Intro5 extends Component {

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
    return (
      <div className="Intro5">
        <p className="Intro5__title">{I18n.t('intro5.title')}</p>
        <div className="Intro5__content">
          <VideoItem
            href={I18n.t('href.video.1')}
            imgSrc="/static/images/intro/tutorial_thum_1.png?date=20220929"
            title={I18n.t('intro5.video1.title')}
            description={I18n.t('intro5.video1.description')}
          />
          <VideoItem
            href={I18n.t('href.video.2')}
            className="VideoItem--2"
            imgSrc="/static/images/intro/tutorial_thum_2.png?date=20220929"
            title={I18n.t('intro5.video2.title')}
            subtitle={I18n.t('tag.novice')}
            description={I18n.t('intro5.video2.description')}
          />
          <VideoItem
            href={I18n.t('href.video.3')}
            className="VideoItem--3"
            imgSrc="/static/images/intro/tutorial_thum_3.png?date=20220929"
            title={I18n.t('intro5.video3.title')}
            subtitle={I18n.t('tag.highProfit')}
            description={I18n.t('intro5.video3.description')}
          />
        </div>
      </div>
    )
  }
}

export default Intro5