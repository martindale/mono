/**
 * @file Client/Server Interface Specification
 */

const { expect } = require('chai')
const Client = require('../../../lib/core/client')
const Server = require('../../../lib/core/server')

before('Initialize client/server', function () {
  return new Server()
    .start()
    .then(instance => {
      const { hostname, port } = instance

      // For basic client/server tests
      const server = instance
      const client = new Client({ hostname, port })

      // For advanced multi-client test suites
      const alice = new Client({ hostname, port })
      const bob = new Client({ hostname, port })

      Object.assign(this, { alice, bob, client, server })

      return Promise.all([
        client.connect(),
        alice.connect(),
        bob.connect()
      ])
    })
})

after('Destroy client/server', function () {
  const { alice, bob, client, server } = this.test.ctx

  return Promise.all([
    client.disconnect(),
    alice.disconnect(),
    bob.disconnect()
  ]).then(() => server.stop())
    .then(() => {
      this.test.ctx.alice = null
      this.test.ctx.bob = null
      this.test.ctx.client = null
      this.test.ctx.server = null
    })
})

describe('API Version 1', function () {
  /**
   * Ensures the client is connected and ready for the rest of the suite
   */
  it('must setup the client/server correctly for further testing', function () {
    expect(this.test.ctx.server.isListening).to.equal(true)
    expect(this.test.ctx.client.isConnected).to.equal(true)
  })
})
