import React from 'react'
import ReactDOM from 'react-dom'
import { Router, Route, IndexRoute, browserHistory } from 'react-router'
import smoothscroll from 'smoothscroll-polyfill'
import { hot } from 'react-hot-loader/root'
import * as Sentry from "@sentry/browser";
import { BrowserTracing } from "@sentry/tracing";

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

  Sentry.init({
    dsn: "https://354503e3b5de4ccc9321d54d91d6383f@o263474.ingest.sentry.io/4504813400948736",
    integrations: [new BrowserTracing()],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
  });
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

const HotApp = hot(App)

ReactDOM.render(renderRoutes(HotApp), document.getElementById('root'))

if (module.hot) {
  module.hot.accept('./App.js', () => {
    const NextApp = require('./App').default
    const HotNextApp = hot(NextApp)
    ReactDOM.render(renderRoutes(HotNextApp), document.getElementById('root'))
  })
}