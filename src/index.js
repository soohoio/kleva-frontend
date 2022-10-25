import React from 'react'
import ReactDOM from 'react-dom'
import { Router, Route, IndexRoute, browserHistory } from 'react-router'
import smoothscroll from 'smoothscroll-polyfill'

window.isMobile = window.isMobile.tablet || window.isMobile.phone

import App from './App'

import IntroPage from './pages/IntroPage'
import MainPage from './pages/MainPage'

import { path$ } from 'streams/location'

import './index.scss'
import { closeModal$ } from './streams/ui'

// Google Tag Manager
if (window.location.host === "kleva.io") {
  (function (w, d, s, l, i) {
    w[l] = w[l] || []; w[l].push({
      'gtm.start':
        new Date().getTime(), event: 'gtm.js'
    }); var f = d.getElementsByTagName(s)[0],
      j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : ''; j.async = true; j.src =
        'https://www.googletagmanager.com/gtm.js?id=' + i + dl; f.parentNode.insertBefore(j, f);
  })(window, document, 'script', 'dataLayer', 'GTM-M36SM6B');
}

// polyfill
smoothscroll.polyfill()

const history = browserHistory

history.listen(({ pathname }) => {
  closeModal$.next(true)
  path$.next(pathname)
})

export const renderRoutes = (rootComponent) => (
  <Router history={history}>
    <Route path="/" component={rootComponent}>
      <IndexRoute component={IntroPage} />
      <Route path="/main" component={MainPage} />
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
