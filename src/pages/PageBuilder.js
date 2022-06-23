import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import Header from '../components/Header'
import Sidebar from '../components/Sidebar'

import './PageBuilder.scss'
import Footer from '../components/Footer'
import LockedKLEVA from '../components/LockedKLEVA'

class PageBuilder extends Component {
  destroy$ = new Subject()

  componentDidMount() {

  }

  componentWillUnmount() {
    this.destroy$.next(true)
  }

  render() {
    const { children } = this.props

    return (
      <>
        <div className="PageBuilder">
          <div className="PageBuilder__topDecoration">
            <div className="PageBuilder__topDecorationContent">
              <img className="PageBuilder__topDecorationImage" src="/static/images/top-decoration.svg" />
            </div>
          </div>
          <Header />
          <div className="PageBuilder__headerDecoration" />
          <div className="PageBuilder__content">
            <Sidebar />
            {children}
          </div>
          <Footer />
        </div>
      </>
    )
  }
}

export default PageBuilder