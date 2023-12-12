/**
 * @file Behavioral specification for the Portal SDK
 */

const Peer = require('@portaldefi/peer')
const chai = require('chai')
const { writeFileSync } = require('fs')
const { inspect } = require('util')
const { Web3 } = require('web3')
const { compile, deploy } = require('../../../portal/test/helpers')
const Sdk = require('../..')

/**
 * Returns whether the tests are being run in debug mode
 * @type {Boolean}
 */
const isDebugEnabled = process.argv.includes('--debug')

/**
 * Prints logs from the peer and the SDK instances, when debug mode is enabled
 * @type {Function}
 */
const log = !isDebugEnabled
  ? function () { }
  : (...args) => console.error(...(args.map(arg => inspect(arg, {
      showHidden: false,
      depth: null,
      colors: true
    }))))

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
before('setup the test environment', async function () {
  // override/install globals
  for (const key in GLOBALS) {
    const existing = global[key]
    global[key] = GLOBALS[key]
    GLOBALS[key] = existing
  }

  // compile and deploy the smart-contracts, and export the abi/address details
  const web3 = this.web3 = new Web3(process.env.PORTAL_ETHEREUM_URL)
  const contracts = this.contracts = await deploy(await compile(), web3)
  const abiFile = process.env.PORTAL_ETHEREUM_CONTRACTS
  writeFileSync(abiFile, JSON.stringify(contracts, null, 2))
  // load the configuration
  // NOTE: This MUST happen after the smart-contract compilation/deployment
  const config = require('../../etc/config.dev')

  // start the peer
  const props = Object.assign({ id: 'portal' }, config.network)
  this.peer = await new Peer(props)
    .on('log', log)
    .start()

  // start all sdk instances
  for (const id of USERS) {
    const { blockchains } = config
    const creds = require(`../../../portal/test/unit/${id}`)
    const props = Object.assign({ id }, config, {
      blockchains: Object.assign({}, blockchains, {
        ethereum: Object.assign({}, blockchains.ethereum, creds.ethereum),
        lightning: Object.assign({}, blockchains.lightning, creds.lightning)
      })
    })

    this[id] = new Sdk(props)
    await this[id]
      .on('log', log)
      .start()
  }
})

/**
 * Tears down the testing environment
 * - Stops the SDK instances for each user
 * - Stops the peer
 * - Restores the global functions that were overridden during setup
 */
after('teardown the test environment', async function () {
  // stop the SDK instance
  await Promise.all(USERS.map(id => this.test.ctx[id].stop()))

  // stop the peer
  await this.test.ctx.peer.stop()
  this.test.ctx.peer = null

  // tear down the web3 instance
  this.test.ctx.web3.provider.disconnect()

  // override/install globals
  for (const key in GLOBALS) {
    const existing = global[key]
    global[key] = GLOBALS[key]
    GLOBALS[key] = existing
  }
})
