/**
 * @file Behavioral specification for the Portal Web Application UI
 */

const App = require('./app')

/**
 * Returns whether the tests are being run in debug mode
 * @type {Boolean}
 */
const isDebugEnabled = process.argv.includes('--debug')

/**
 * A list of user accounts to setup in the testing environment.
 *
 * Each of these accounts would be available on `this.test.ctx` in the testing
 * environment.
 *
 * @type {Array}
 */
const USERS = ['alice', 'bob']

/**
 * Sets up the testing environment
 * - Sets up global functions for use within tests
 * - Initializes and starts a peer
 * - Initializes and starts browser instances for each user
 */
before(async function () {
  const { url } = this.test.ctx.peer
  const puppeteer = {
    args: [],
    headless: isDebugEnabled ? false : 'new',
    slowMo: isDebugEnabled ? 100 : 0
  }

  // launch the browsers and navigate to the page
  for (const id of USERS) {
    this[id] = new App({ id, puppeteer })
      .on('log', (...args) => isDebugEnabled
        ? console.log(...args)
        : function () {})
    await this[id].open(url, puppeteer)
  }
})

/**
 * Tears down the testing environment
 * - Stops the browser instances for each user
 * - Stops the peer
 * - Restores the global functions that were overridden during setup
 */
after(async function () {
  // close the browsers
  for (const user of USERS) {
    await this.test.ctx[user].close()
    this.test.ctx[user] = null
  }
})
