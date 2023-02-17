const webpack = require('webpack')

const path = require('path')
const fs = require('fs')

const Dotenv = require('dotenv-webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const nodeStdLib = require('node-stdlib-browser')

const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const extractCSS = new MiniCssExtractPlugin({
  filename: '[hash:6]-lyf.css'
})

const ENV_DIR = './config/'
const envPath = ENV_DIR + `${process.env.NODE_ENV}`.toLowerCase() + '.env'

module.exports = {
  devtool: 'source-map',
  mode: 'development',
  node: {},
  entry: [
    'whatwg-fetch',
    '@babel/polyfill',
    'react-hot-loader/patch',
    path.resolve(__dirname, 'src/index.js'),
    'webpack-hot-middleware/client',
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
                loader: 'postcss-loader',
                options: {
                  postcssOptions: {
                    ident: 'postcss',
                    plugins: [
                      require('postcss-import'),
                      require('tailwindcss'),
                      require('autoprefixer'),
                    ],
                  },
                },
              },
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
  plugins: [
    new NodePolyfillPlugin(),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'public/index.html'),
      inject: 'body',
    }),
    extractCSS,
    new webpack.HotModuleReplacementPlugin(),
    new ReactRefreshWebpackPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new Dotenv({
      path: envPath,
    }),
    new webpack.EnvironmentPlugin({
      MODE: process.env.MODE || "development"
    }),
  ],
}