import React from 'react'
import ReactDOM from 'react-dom'
import { Router, Route, IndexRoute, browserHistory } from 'react-router'
import smoothscroll from 'smoothscroll-polyfill'

window.isMobile = window.isMobile.tablet || window.isMobile.phone

import App from './App'

import LendPage from './pages/LendPage'
import StakePage from './pages/StakePage'
import FarmPage from './pages/FarmPage'

import { path$ } from 'streams/location'

import './index.scss'


// polyflil
smoothscroll.polyfill()

const history = browserHistory

history.listen(({ pathname }) => {
  path$.next(pathname)
})

export const renderRoutes = (rootComponent) => (
  <Router history={history}>
    <Route path="/" component={rootComponent}>
      <IndexRoute component={LendPage} />
      <Route path="/lend" component={LendPage} />
      <Route path="/stake" component={StakePage} />
      <Route path="/farm" component={FarmPage} />
    </Route>
  </Router>
)

ReactDOM.render(renderRoutes(App), document.getElementById('root'))

if (module.hot) {
  module.hot.accept('./App.js', () => {
    const NextApp = require('./App').default
    ReactDOM.render(renderRoutes(NextApp), document.getElementById('root'))
  })
}
