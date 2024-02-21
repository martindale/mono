#!/usr/bin/env node
/**
 * @file Runs the app in development mode
 */

const pkg = require('../package.json')
const { Parcel } = require('@parcel/core')
const Peer = require('@portaldefi/peer')
const chokidar = require('chokidar')
const { join } = require('path')

/**
 * npm modules that are not tracked by the bundler's watcher
 * @type {Array}
 */
const MODULES = [
  join(__dirname, '..', '..', 'portal'),
  join(__dirname, '..', '..', 'sdk')
]

/**
 * Files ignored in the aforementioned npm modules
 * @type {Array}
 */
const IGNORED = [
  '**/*.md',
  '**/*.nix',
  /.git$/,
  /.nvmrc$/,
  /.parcel-cache$/,
  /dist$/,
  /docs$/,
  /node_modules$/,
  /package-lock.json$/,
  /package.json$/
]

/**
 * Entry point to the web app
 * @type {String}
 */
const APP_ENTRY = join(__dirname, '..', pkg.source)

/**
 * Path to write the build assets
 * @type {String}
 */
const APP_OUTPUT = join(__dirname, '..', 'dist')

/**
 * Bundles the web-app
 * @type {Parcel}
 */
const APP_BUNDLER = new Parcel({
  entries: APP_ENTRY,
  defaultConfig: '@parcel/config-default',
  mode: 'development',
  env: {
    NODE_ENV: 'development'
  }
})

/**
 * Tracks the Peer instance used to serve the web-app
 * @type {Peer|null}
 */
let peer = null

/**
 * Starts the peer, and runs a bundler upon peer startup
 * @returns {Void}
 */
function startPeer () {
  new Peer({ root: APP_OUTPUT })
    .on('error', console.error)
    .on('log', console.error)
    .start()
    .then(async instance => {
      const watcher = await APP_BUNDLER.watch((err, event) => {
        if (err) {
          console.error('error', 'bundler.build', {
            '@type': 'Parcel',
            status: 'errored',
            error: err
          })
        } else if (event.type === 'buildFailure') {
          console.error('error', 'bundler.build', {
            '@type': 'Parcel',
            status: 'failed',
            error: event.diagnostics
          })
          process.exit(1)
        } else if (event.type === 'buildSuccess') {
          console.error('info', 'bundler.build', {
            '@type': 'Parcel',
            status: 'success',
            buildTime: event.buildTime
          })
        }
      })

      peer = instance.once('stop', () => {
        watcher.unsubscribe()
        startPeer()
      })
    })
}

/**
 * Sets up a watcher to restart the Peer instance, as needed
 * @returns {Void}
 */
;(async function main () {
  chokidar.watch(MODULES, { ignored: IGNORED, persistent: true })
    .on('ready', () => startPeer())
    .on('change', (path, stats) => peer.stop())
}())
