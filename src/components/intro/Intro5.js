import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './Intro5.scss'
import { I18n } from '../common/I18n'

const VideoItem = ({ imgSrc, title, description }) => {
  return (
    <div className="VideoItem">
      <img className="VideoItem__image" src={imgSrc} />
      <p className="VideoItem__title">{title}</p>
      <p className="VideoItem__description">{description}</p>
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
            imgSrc="/static/images/intro/tutorial_thum_1.png"
            title={I18n.t('intro5.video1.title')}
            description={I18n.t('intro5.video1.description')}
          />
          <VideoItem
            imgSrc="/static/images/intro/tutorial_thum_2.png"
            title={I18n.t('intro5.video2.title')}
            description={I18n.t('intro5.video2.description')}
          />
          <VideoItem
            imgSrc="/static/images/intro/tutorial_thum_3.png"
            title={I18n.t('intro5.video3.title')}
            description={I18n.t('intro5.video3.description')}
          />
        </div>
      </div>
    )
  }
}

export default Intro5