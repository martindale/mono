/**
 * @file Behavioral specification for the Portal SDK
 */

const config = require('../etc/config.dev')
const Sdk = require('..')
const Peer = require('@portaldefi/peer')
const chai = require('chai')

describe('Portal SDK for node.js', function () {
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
   * - Initializes and starts SDK instances for each user
   */
  before(async function () {
    // override/install globals
    for (const key in GLOBALS) {
      const existing = global[key]
      global[key] = GLOBALS[key]
      GLOBALS[key] = existing
    }

    this.peer = await new Peer(config.network)
      .on('log', (...args) => isDebugEnabled
        ? console.log(...args)
        : function () {})
      .start()

    await Promise.all(USERS.map(id => {
      const credentials = require(`../../portal/test/unit/${id}`)
      const props = Object.assign({}, config, {
        credentials,
        network: Object.assign({}, config.network, { id })
      })
      this[id] = new Sdk(props)
      return this[id].start()
    }))
  })

  /**
   * Tears down the testing environment
   * - Stops the SDK instances for each user
   * - Stops the peer
   * - Restores the global functions that were overridden during setup
   */
  after(async function () {
    await Promise.all(USERS.map(name => this.test.ctx[name].stop()))
    await this.test.ctx.peer.stop()

    // override/install globals
    for (const key in GLOBALS) {
      const existing = global[key]
      global[key] = GLOBALS[key]
      GLOBALS[key] = existing
    }
  })

  /**
   * Ensure the Peer is up and running, and ready for testing
   */
  it('must initilize a peer for the test environment', function () {
    expect(this.test.ctx.peer.isListening).to.equal(true)
  })

  it('must initialize one or more SDK instances for every user', function () {
    USERS.forEach(name => expect(this[name].isConnected).to.equal(true))
  })

  require('./unit/orderbooks/limit.spec')
  require('./unit/swaps/evm-lightning.spec')
})
