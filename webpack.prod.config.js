const webpack = require('webpack')

const path = require('path')
const fs = require('fs')

const Dotenv = require('dotenv-webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const CopyWebpackPlugin = require('copy-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const WebpackObfuscator = require('webpack-obfuscator')

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const nodeStdLib = require('node-stdlib-browser')

const extractCSS = new MiniCssExtractPlugin({
  filename: '[hash:6]-lyf.css'
})

const ENV_DIR = './config/'
const envPath = ENV_DIR + `${process.env.NODE_ENV}`.toLowerCase() + '.env'

module.exports = {
  mode: 'production',
  node: {},
  entry: [
    'whatwg-fetch',
    '@babel/polyfill',
    path.resolve(__dirname, 'src/index.js'),
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
    filename: '[hash:6]-lyf.js',
  },
  module: {
    rules: [
      {
        oneOf: [
          {
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
              loader: 'babel-loader',
              options: { compact: false },
            },
          },
          {
            test: /\.css$/,
            use: [MiniCssExtractPlugin.loader, 'css-loader'],
          },
          {
            test: /\.scss$/,
            use: [
              MiniCssExtractPlugin.loader,
              'css-loader',
              {
                loader: 'sass-loader',
                options: {
                  sassOptions: {
                    includePaths: [path.resolve(__dirname, 'src/styles')],
                  }
                },
              },
              {
                loader: 'sass-resources-loader',
                options: {
                  resources: [
                    './src/styles/_colors.scss',
                    './src/styles/_mixins.scss',
                    './src/styles/_common.scss',
                    './src/styles/_fonts.scss',
                  ]
                },
              },
            ],
          },
        ]
      }
    ],
  },
  resolve: {
    alias: {
      constants: path.resolve(__dirname, 'src/constants/'),
      components: path.resolve(__dirname, 'src/components/'),
      utils: path.resolve(__dirname, 'src/utils/'),
      contracts: path.resolve(__dirname, 'contracts'),
      images: path.resolve(__dirname, 'static/images/'),
      pages: path.resolve(__dirname, 'src/pages/'),
      streams: path.resolve(__dirname, 'src/streams/'),
      abis: path.resolve(__dirname, 'src/abis/'),
    },
    fallback: {
      "http": require.resolve("stream-http"),
      "https": require.resolve("https-browserify"),
      "assert": require.resolve("assert/"),
      "buffer": require.resolve("buffer/"),
      "fs": false,
      "os": require.resolve("os-browserify/browser"),
      "path": require.resolve("path-browserify"),
      "process": require.resolve("process/browser"),
      "stream": require.resolve("stream-browserify"),
      "util": require.resolve("util/"),
      ...nodeStdLib,
    }
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({
      terserOptions: {
        mangle: true,
        extractComments: true,
      }
    })],
  },
  plugins: [
    new WebpackObfuscator({
      StringArray: true,
      stringArrayRotate: true,
      renameGlobals: true,
    }),
    new NodePolyfillPlugin(),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'public/index.html'),
      inject: 'body',
    }),
    extractCSS,
    new webpack.NoEmitOnErrorsPlugin(),
    new CopyWebpackPlugin({
      patterns: [{
        from: 'static',
        to: 'static',
      }]
    }),
    new CompressionPlugin({
      filename: '[path][base]',
      algorithm: 'gzip',
      test: /\.(js|css|html)$/,
      deleteOriginalAssets: true,
    }),
    new Dotenv({
      path: envPath,
    }),
    new webpack.EnvironmentPlugin({
      MODE: process.env.MODE || "production"
    }),
    new CleanWebpackPlugin(['dist']),
  ],
}