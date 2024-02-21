/**
 * @file Client/Server Interface Specification
 */

const Client = require('@portaldefi/sdk')
const { expect } = require('chai')
const Server = require('../../lib/core/server')

before('Initialize client/server', function () {
  return new Server()
    .start()
    .then(instance => {
      const { hostname, port } = instance

      // For basic client/server tests
      const server = instance
      const client = new Client({ id: 'client', hostname, port })

      Object.assign(this, { client, server })

      return client.connect()
    })
})

after('Destroy client/server', function () {
  const { client, server } = this.test.ctx

  return client.disconnect()
    .then(() => server.stop())
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
