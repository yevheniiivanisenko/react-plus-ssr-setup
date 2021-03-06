import path from 'path'
import express from 'express'
import manifestHelpers from 'express-manifest-helpers'
import React from 'react'
import {renderToString} from 'react-dom/server'
import {StaticRouter} from 'react-router-dom'
import {Provider} from 'react-redux'
import {HelmetProvider} from 'react-helmet-async'

import paths from '../../config/paths'
import {log} from '../../scripts/utils'
import {configureStore} from '../shared/store'
import App from '../shared/App'
import Html from './HTML'

const app = express()
const PORT = process.env.PORT || 5000

app.use('/favicon.ico', (req, res) => {
  res.send('')
})

app.use(paths.publicPath, express.static(path.join(paths.clientBuild, paths.publicPath)))

const manifestPath = path.join(paths.clientBuild, paths.publicPath, 'manifest.json')

app.use(
  manifestHelpers({
    manifestPath,
  }),
)

app.use((req, res, next) => {
  req.store = configureStore()
  return next()
})

app.get('*', (req, res) => {
  // we use style-loader in dev mode instead of MiniCssExtractPlugin.loader, since we do not produce bundle.css
  const styles = process.env.NODE_ENV === 'production' ? [res.locals.assetPath('bundle.css')] : []
  const helmetContext = {}

  const content = renderToString(
    <Provider store={req.store}>
      <StaticRouter location={req.url} context={{}}>
        <HelmetProvider context={helmetContext}>
          <App />
        </HelmetProvider>
      </StaticRouter>
    </Provider>,
  )
  const {helmet} = helmetContext

  res.send(
    '<!doctype html>' +
      renderToString(
        <Html scripts={[res.locals.assetPath('bundle.js')]} styles={styles} helmetContext={helmet}>
          {content}
        </Html>,
      ),
  )
})

app.listen(PORT, () => {
  log(`App is running: 🌎 http://localhost:${PORT}`, 'info')
})
