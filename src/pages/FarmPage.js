import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import PageBuilder from './PageBuilder'

import MyPositions from 'components/MyPositions'

import './FarmPage.scss'

class FarmPage extends Component {
  destroy$ = new Subject()

  componentDidMount() {

  }

  componentWillUnMount() {
    this.destroy$.next(true)
  }

  render() {

    return (
      <PageBuilder>
        <div className="FarmPage">
          <MyPositions />
        </div>
      </PageBuilder>
    )
  }
}

export default FarmPage