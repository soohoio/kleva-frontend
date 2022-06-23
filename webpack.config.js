const webpack = require('webpack')
const path = require('path')
const fs = require('fs')

const Dotenv = require('dotenv-webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')

const extractCSS = new ExtractTextPlugin('[hash:6]-lyf.css')

const ENV_DIR = './config/'
const envPath = ENV_DIR + `${process.env.NODE_ENV}`.toLowerCase() + '.env'

module.exports = {
  devtool: 'source-map',
  mode: 'development',
  node: {
    fs: 'empty',
  },
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
        test: /\.js$/,
        exclude: /node_modules/,
        // use: 'babel-loader',
        loader: 'babel-loader',
        query: { compact: false },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.scss$/,
        use: extractCSS.extract({
          use: [
            {
              loader: 'css-loader',
            },
            {
              loader: 'sass-loader',
              options: {
                includePaths: [path.resolve(__dirname, 'src/styles')],
              },
            },
            {
              loader: 'sass-resources-loader',
              options: {
                // Or array of paths
                resources: [
                  './src/styles/_colors.scss',
                  './src/styles/_mixins.scss',
                  './src/styles/_common.scss',
                  './src/styles/_fonts.scss',
                ]
              },
            },
          ],
        }),
      },
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
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'public/index.html'),
      inject: 'body',
    }),
    extractCSS,
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new Dotenv({
      path: envPath,
    }),
    new webpack.EnvironmentPlugin(['MODE', process.env.MODE]),
  ],
}
