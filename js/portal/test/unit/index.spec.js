/**
 * @file Client/Server Interface Specification
 */

const { expect } = require('chai')
const { writeFileSync } = require('fs')
const Web3 = require('web3')
const { compile, deploy } = require('../helpers')
const Client = require('../../lib/core/client')
const Server = require('../../lib/core/server')

before('Compile contracts', async function () {
  // Web3
  const web3 = new Web3(process.env.PORTAL_ETHEREUM_URL)
  const compiled = await compile()
  const contracts = await deploy(compiled, web3)
  writeFileSync(process.env.PORTAL_ETHEREUM_CONTRACTS, JSON.stringify(contracts))
  Object.assign(this, { web3, contracts })

  // Server and clients
  const server = await (new Server()).start()
  const { hostname, port } = server

  const create = id => {
    const credentials = require(`./${id}`)
    return new Client({ id, hostname, port, credentials })
  }
  const client = new Client({ id: 'client', hostname, port })
  const alice = create('alice')
  const bob = create('bob')
  await Promise.all([
    client.connect(),
    alice.connect(),
    bob.connect()
  ])

  Object.assign(this, { alice, bob, client, server })
})

after('Destroy contracts', async function () {
  this.test.ctx.contracts = null
  this.test.ctx.web3 = null

  const { alice, bob, client, server } = this.test.ctx

  await Promise.all([
    client.disconnect(),
    alice.disconnect(),
    bob.disconnect()
  ])
  await server.stop()

  this.test.ctx.alice = null
  this.test.ctx.bob = null
  this.test.ctx.client = null
  this.test.ctx.server = null
})

describe('Test Environment', function () {
  it('must compile web3 contracts', function () {
    expect(this.test.ctx.contracts).is.an('object')
    expect(this.test.ctx.web3).is.an.instanceof(Web3)
  })

  /**
   * Ensures the client is connected and ready for the rest of the suite
   */
  it('must setup the client/server correctly for further testing', function () {
    expect(this.test.ctx.server.isListening).to.equal(true)
    expect(this.test.ctx.client.isConnected).to.equal(true)
  })
})
