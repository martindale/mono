/**
 * @file Test environment setup and teardown
 */

const Peer = require('@portaldefi/peer')
const chai = require('chai')
const { resolve } = require('path')
const vite = require('vite')

/**
 * Returns whether the tests are being run in debug mode
 * @type {Boolean}
 */
const isDebugEnabled = process.argv.includes('--debug')

/**
 * Maps globally visible keys to their values for the duration of the tests
 *
 * The keys/values set here override any existing globals for the duration of
 * the tests.
 *
 * @type {Object}
 */
const GLOBALS = {
  debug: isDebugEnabled ? console.debug : function () {},
  expect: chai.expect
}

/**
 * The vite build
 * @type {Config}
 */
const config = {
  root: resolve(__dirname, '..'),
  build: {
    outDir: resolve(__dirname, '..', 'dist'),
    watch: {}
  },
  mode: 'development',
  clearScreen: false
}

/**
 * Used to determine when the build is ready and to start the test
 * @type {Boolean|Function}
 */
let ready = false

/**
 * The build watcher
 * @type {BuildWatcher}
 */
let watcher = null

// Build the app
vite.build(config)
  .then(result => {
    watcher = result
    watcher.on('event', event => {
      if (event.code !== 'END') return
      if (ready) {
        ready()
      } else {
        ready = true
      }
    })
  })

/**
 * Sets up the testing environment
 * - Build the assets
 * - Sets up global functions for use within tests
 * - Initializes and starts a peer
 */
before('Setup the test environment', function (done) {
  // override/install globals
  for (const key in GLOBALS) {
    const existing = global[key]
    global[key] = GLOBALS[key]
    GLOBALS[key] = existing
  }

  // start the peer
  this.peer = new Peer({ root: config.build.outDir })
  this.peer
    .once('start', () => {
      // if the build is ready, the start the test; if not, wait for the build
      if (ready) return done()
      ready = done
    })
    .on('log', (...args) => isDebugEnabled
      ? console.log(...args)
      : function () {})
    .start()
})

/**
 * Tears down the testing environment
 * - Stops the browser instances for each user
 * - Stops the peer
 * - Restores the global functions that were overridden during setup
 */
after('Teardown the test environment', async function () {
  // stop the peer
  await this.test.ctx.peer.stop()

  // override/install globals
  for (const key in GLOBALS) {
    const existing = global[key]
    global[key] = GLOBALS[key]
    GLOBALS[key] = existing
  }

  // close the watcher
  await watcher.close()
})
