const opn = require('opn')
const path = require('path')
const compression = require('compression')
const uuid = require('uuid')
const express = require('express')
const webpack = require('webpack')
const webpackMiddleware = require('webpack-dev-middleware')
const webpackHotMiddleware = require('webpack-hot-middleware')
const MemoryFileSystem = require('memory-fs')

require('dotenv').config({ path: './config/local.env' })
const config = require('./webpack.config.js')

const port = process.env.PORT
const app = express()
app.disable("x-powered-by")

const compiler = webpack(config)
const middleware = webpackMiddleware(compiler, {
  publicPath: config.output.publicPath,
  stats: {
    colors: true,
    hash: false,
    timings: true,
    chunks: false,
    chunkModules: false,
    modules: false,
  },
  outputFileSystem: new MemoryFileSystem() // Set the outputFileSystem option
})

app.use(middleware)

app.use('/static', express.static(path.join(__dirname, 'static')))
app.use(webpackHotMiddleware(compiler))

app.get('*', (req, res) => {
  console.log(compiler.outputPath, `compiler.outputPath`)
  
  var filename = path.join(compiler.outputPath, 'index.html');
  compiler.outputFileSystem.readFile(filename, function (err, result) {
    if (err) {
      return next(err);
    }
    res.set('content-type', 'text/html');
    res.send(result);
    res.end();
  });
});

app.listen(port, '0.0.0.0', function onStart(err) {
  if (err) {
    console.log(err)
  }
  opn(`http://localhost:${port}`);
})