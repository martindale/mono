/**
 * @file The Unit Test Environment builder
 */

const Sdk = require('@portaldefi/sdk')
const chai = require('chai')
const { writeFileSync } = require('fs')
const Web3 = require('web3')
const { compile, deploy } = require('../helpers')
const Peer = require('../../lib/core/server')

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

before('Setup Test Environment', async function () {
  // override/install globals
  for (const key in GLOBALS) {
    const existing = global[key]
    global[key] = GLOBALS[key]
    GLOBALS[key] = existing
  }

  // Web3
  const web3 = this.web3 = new Web3(process.env.PORTAL_ETHEREUM_URL)
  const contracts = this.contracts = await deploy(await compile(), web3)
  const abiFile = process.env.PORTAL_ETHEREUM_CONTRACTS
  writeFileSync(abiFile, JSON.stringify(contracts))
  expect(this.test.ctx.contracts).is.an('object')
  expect(this.test.ctx.web3).is.an.instanceof(Web3)

  // Peer
  this.peer = await new Peer()
    .on('log', (...args) => isDebugEnabled
      ? console.log(...args)
      : function () {})
    .start()
  expect(this.test.ctx.peer.isListening).to.equal(true)

  // SDK instances
  const { hostname, port } = this.peer
  await Promise.all(USERS.map(id => {
    const credentials = require(`./${id}`)
    this[id] = new Sdk({ credentials, network: { id, hostname, port } })
    return this[id].start()
  }))
  USERS.forEach(name => {
    expect(this.test.ctx[name].isConnected).to.equal(true)
  })
})

after('Teardown Test Environment', async function () {
  this.test.ctx.contracts = null
  this.test.ctx.web3 = null

  await Promise.all(USERS.map(name => this.test.ctx[name].stop()))
  await this.test.ctx.peer.stop()

  // override/install globals
  for (const key in GLOBALS) {
    const existing = global[key]
    global[key] = GLOBALS[key]
    GLOBALS[key] = existing
  }
})
