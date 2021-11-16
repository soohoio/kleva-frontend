import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import Header from '../components/Header'
import Sidebar from '../components/Sidebar'

import './PageBuilder.scss'

class PageBuilder extends Component {
  destroy$ = new Subject()

  componentDidMount() {

  }

  componentWillUnMount() {
    this.destroy$.next(true)
  }

  render() {
    const { children } = this.props

    return (
      <div className="PageBuilder">
        <Header />
        <div className="PageBuilder__headerDecoration" />
        <div className="PageBuilder__content">
          <Sidebar />
          {children}
        </div>
      </div>
    )
  }
}

export default PageBuilder