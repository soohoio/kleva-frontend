import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, of, BehaviorSubject } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import './FAQ.scss'
import { I18n } from '../common/I18n'

const FAQItem = ({ title, href, description, onClick, isActive }) => {
  return (
    <div 
      className={cx("FAQItem", {
        "FAQItem--active": isActive,
      })}
    >
      <p onClick={onClick} className="FAQItem__title">{title}</p>
      {isActive && (
        <>
          <p className="FAQItem__description">{description}</p>
          <p
            onClick={() => window.open(href || I18n.t('docs.kleva.io'))}
            className="FAQItem__link"
          >
            {I18n.t('intro7.seeDetail')}
          </p>
        </>
      )}
    </div>
    
  )
}

class FAQ extends Component {

  destroy$ = new Subject()

  activeIdx$ = new BehaviorSubject()
  
  componentDidMount() {
    merge(
      this.activeIdx$,
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

  toggleActive = (idx) => {
    if (idx == this.activeIdx$.value) {
      this.activeIdx$.next(null)
      return
    }
    this.activeIdx$.next(idx)
  }
    
  render() {
    return (
      <div className="FAQ">
        <p className="FAQ__title">{I18n.t('intro7.title')}</p>
        <FAQItem 
          href={I18n.t('href.faq.1.q')}
          title={I18n.t('faq.1.q')} 
          description={I18n.t('faq.1.description')} 
          isActive={this.activeIdx$.value == 1}
          onClick={() => this.toggleActive(1)}
        />
        <FAQItem 
          href={I18n.t('href.faq.2.q')}
          title={I18n.t('faq.2.q')} 
          description={I18n.t('faq.2.description')} 
          isActive={this.activeIdx$.value == 2}
          onClick={() => this.toggleActive(2)}
        />
        <FAQItem 
          href={I18n.t('href.faq.3.q')}
          title={I18n.t('faq.3.q')} 
          description={I18n.t('faq.3.description')} 
          isActive={this.activeIdx$.value == 3}
          onClick={() => this.toggleActive(3)}
        />
        <FAQItem 
          href={I18n.t('href.faq.4.q')}
          title={I18n.t('faq.4.q')} 
          description={I18n.t('faq.4.description')} 
          isActive={this.activeIdx$.value == 4}
          onClick={() => this.toggleActive(4)}
        />
        <button 
          onClick={() => window.open(I18n.t('docs.kleva.io'))}
          className="FAQ__see"
        >
          {I18n.t('intro7.see')}
        </button>
      </div>
    )
  }
}

export default FAQ