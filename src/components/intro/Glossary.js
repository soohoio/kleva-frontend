import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { BehaviorSubject, Subject, merge, of, fromEvent } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import { I18n } from 'components/common/I18n'

import './Glossary.scss'

import { currentTab$ } from '../../streams/view'
import { range } from 'lodash'
import { openModal$ } from '../../streams/ui'
import Modal from '../common/Modal'
import { backPage, getQS } from '../../utils/misc'
import { prevLocation$ } from '../../streams/location'

const GlossaryItem = ({ href, imgSrc }) => {
  return (
    <div
      onClick={() => window.open(href)}
      className="GlossaryItem"
    >
      <img className="GlossaryItem__image" src={imgSrc} />
    </div>
  )
}

class Glossary extends Component {

  destroy$ = new Subject()
  $container = createRef()
  
  $elem1 = createRef()
  $elem2 = createRef()
  $elem3 = createRef()

  // 'defiGeneral', 'lending', 'farming'
  scrollAt$ = new BehaviorSubject('defiGeneral')

  componentDidMount() {
    merge(
      currentTab$,
      this.scrollAt$,
    ).pipe(
      debounceTime(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })

    fromEvent(this.$container.current, 'scroll').pipe(
      tap(() => {

        if (this.$container.current.scrollTop < 523) {
          this.scrollAt$.next('defiGeneral')
        }

        if (this.$container.current.scrollTop >= 523 && this.$container.current.scrollTop < 758) {
          this.scrollAt$.next('lending')
          return
        }
        
        if (this.$container.current.scrollTop >= 758) {
          this.scrollAt$.next('farming')
          return
        }

        // const scrollTop = 

        // const { y: defiGeneralY } = this.$elem1.current.getBoundingClientRect()
        // const { y: lendingY } = this.$elem2.current.getBoundingClientRect()
        // const { y: farmingY } = this.$elem3.current.getBoundingClientRect()

        // defiGeneralY
        // lendingY
        // farmingY
      }),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      
    })
  }

  componentWillUnmount() {
    this.destroy$.next(true)
  }

  render() {

    return (
      <div className="Glossary">
        <div className="GlossaryHeader">
          <p className="GlossaryHeader__title">
            {I18n.t('glossary')}
            <img
              onClick={() => {
                backPage()
              }}
              className="GlossaryHeader__close"
              src="/static/images/exported/x.svg?date=20220929"
            />
          </p>
        </div>
        <div className="Glossary__tabs">
          <a
            href="#glossary-defiGeneral"
            className={cx("Glossary__tab", {
              "Glossary__tab--active": this.scrollAt$.value == 'defiGeneral',
            })}
            onClick={() => {
              const $tabs = document.querySelector('.Glossary__tabs')
              $tabs.scrollLeft = 0
            }}
          >
            {I18n.t('glossary.defiGeneral')}
          </a>
          <a
            href="#glossary-lend"
            className={cx("Glossary__tab", {
              "Glossary__tab--active": this.scrollAt$.value == 'lending',
            })}
            onClick={() => {
              
            }}
          >
            {I18n.t('glossary.lend')}
          </a>
          <a
            href="#glossary-farming"
            className={cx("Glossary__tab", {
              "Glossary__tab--active": this.scrollAt$.value == 'farming',
            })}
            onClick={() => {
              const $tabs = document.querySelector('.Glossary__tabs')
              $tabs.scrollLeft = $tabs.scrollWidth - $tabs.offsetWidth
            }}
          >
            {I18n.t('glossary.farming')}
          </a>
        </div>
        <div ref={this.$container}  className="Glossary__content">
          <p ref={this.$elem1} id="glossary-defiGeneral" className="Glossary__category">{I18n.t('glossary.defiGeneral')}</p>
          <div className="Glossary__itemList">
            {range(1, 10).map((i) => {
              return (
                <div
                  className="Glossary__itemTitle"
                  onClick={() => {
                    openModal$.next({
                      component: (
                        <Modal title={I18n.t(`glossary.${i}.title`)}>
                          <p className="LockupInfoModal__description">{I18n.t(`glossary.${i}.description`)}</p>
                        </Modal>
                      )
                    })
                  }}
                >
                  {I18n.t(`glossary.${i}.title`)}
                </div>
              )
            })}
          </div>
          <p ref={this.$elem2} id="glossary-lend" className="Glossary__category">{I18n.t('glossary.lend')}</p>
          <div className="Glossary__itemList">
            {range(10, 14).map((i) => {
              return (
                <div
                  className="Glossary__itemTitle" 
                  onClick={() => {
                    openModal$.next({
                      component: (
                        <Modal title={I18n.t(`glossary.${i}.title`)}>
                          <p className="LockupInfoModal__description">{I18n.t(`glossary.${i}.description`)}</p>
                        </Modal>
                      )
                    })
                  }}
                >
                  {I18n.t(`glossary.${i}.title`)}
                </div>
              )
            })}
          </div>
          
          <p ref={this.$elem3} id="glossary-farming" className="Glossary__category">{I18n.t('glossary.farming')}</p>
          <div className="Glossary__itemList">
            {range(14, 27).map((i) => {
              return (
                <div
                  className="Glossary__itemTitle"
                  onClick={() => {
                    openModal$.next({
                      component: (
                        <Modal title={I18n.t(`glossary.${i}.title`)}>
                          <p className="LockupInfoModal__description">{I18n.t(`glossary.${i}.description`)}</p>
                        </Modal>
                      )
                    })
                  }}
                >
                  {I18n.t(`glossary.${i}.title`)}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }
}

export default Glossary