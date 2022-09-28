/**
 * @file Behavioral specification for the HTTP client and server
 */

const { expect } = require('chai')
const { join } = require('path')
const Client = require('../../lib/core/client')
const Server = require('../../lib/core/server')

/**
 * Endpoints exposed by the server expected to be seen publicly
 * @type {Array}
 */
const ENDPOINTS = [
  '/api/v1/fees',
  '/api/v1/swap'
]

/**
 * Client/Server test suite
 */
describe('Client/Server', function () {
  /**
   * Validates the client/server instantiation and expected instance interfaces
   */
  describe('Instantiation', function () {
    it('must instantiate a server with reasonable defaults', function () {
      let server = null

      expect(() => { server = new Server() }).to.not.throw()

      expect(server).to.be.an.instanceof(Server)
      expect(server.hostname).to.be.a('string').that.equals('localhost')
      expect(server.port).to.be.a('number').that.equals(0)
      expect(server.endpoints).to.be.an('array').that.deep.equal(ENDPOINTS)
    })

    it('must instantiate a client with reasonable defaults', function () {
      let client = null

      expect(() => { client = new Client() }).to.not.throw()

      expect(client).to.be.an.instanceof(Client)
      expect(client.hostname).to.be.a('string').that.equals('localhost')
      expect(client.port).to.be.a('number').that.equals(80)
    })
  })

  describe('Operation', function () {
    let client, server

    /**
     * Instantiate a Server and a Client for this section of the test suite
     * @returns {Promise} Resolves when the client/server are ready for use
     */
    before(function () {
      return new Server({ api: join(__dirname, 'fixtures') })
        .once('start', instance => {
          const { hostname, port } = instance

          server = instance
          client = new Client({ hostname, port })
        })
        .start()
    })

    /**
     * Stop the client/server instances at the end of the test suite
     * @returns {Promise} Resolves once the server has stopped
     */
    after(function () {
      return server
        .once('stop', instance => {
          server = null
          client = null
        })
        .stop()
    })

    /**
     * Expected user stores a.k.a. the happy paths
     */
    describe('Expected', function () {
      /**
       * Tests sending a json object from a client to the server, and echoing it
       * back to the client.
       */
      it('must send/receive JSON data', function () {
        const args = { method: 'GET', path: '/fixtures/echo' }
        const data = { foo: 'bar', bar: 'baz' }
        return client._request(args, data)
          .then(json => expect(json).to.be.an('object').that.deep.equals(data))
      })

      /**
       * Tests if HTTP methods to a particular endpoint are routed correctly
       */
      describe('must route to the correct HTTP methods', function () {
        [
          'GET',
          'POST'
        ].forEach(method => it(method, function () {
          const args = { method, path: '/fixtures/http_methods' }
          const data = { foo: 'bar', bar: 'baz' }
          return client._request(args, data)
            .then(json => expect(json).to.be.an('object').that.deep.equals({
              method,
              json: data
            }))
        }))
      })
    })

    /**
     * Expected errors and pathological cases
     */
    describe('Error Handling', function () {
      it('must return a 400 for bad JSON')
      it('must return 404 for unknown/unexpected endpoints')
      it('must return 405 for unknown/unexpected HTTP methods')
      it('must return 500 for unknown/unexpected errors')
    })
  })
})
