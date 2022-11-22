/**
 * @file Behavioral specification for the HTTP client and server
 */

const { expect } = require('chai')
const { join } = require('path')
const Client = require('../../../lib/core/client')
const Server = require('../../../lib/core/server')

/**
 * Endpoints exposed by the server expected to be seen publicly
 * @type {Array}
 */
const ENDPOINTS = [
  '/api/v1/updates',
  '/api/v1/alive',
  '/api/v1/fees',
  '/api/v1/orderbook/limit',
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
        .start()
        .then(instance => {
          const { hostname, port } = instance
          server = instance
          client = new Client({ hostname, port, pathname: '/fixtures' })
          return client.connect()
        })
    })

    /**
     * Stop the client/server instances at the end of the test suite
     * @returns {Promise} Resolves once the server has stopped
     */
    after(function (done) {
      client
        .once('disconnected', () => server
          .once('stop', instance => {
            server = null
            client = null
            done()
          })
          .stop())
        .disconnect()
    })

    /**
     * Expected user stores a.k.a. the happy paths
     */
    describe('Expected', function () {
      /**
       * Ensures the client is connected and ready for the rest of the suite
       */
      it('must have an open websocket connection', function () {
        expect(client.isConnected).to.equal(true)
      })

      /**
       * Tests sending and receiving messages over the websocket
       * @param {Function} done Function called when the test is done
       */
      it('must echo websocket messages back to the client', function (done) {
        const obj = { foo: 'bar' }

        client
          .once('message', data => {
            expect(data).to.be.an('object').that.deep.equals(obj)
            done()
          })
          ._send(obj)
      })

      /**
       * Tests if the server is exposing all the expected endpoints
       */
      it('must expose the expected endpoints', function () {
        expect(server.endpoints).to.be.an('array').that.deep.equals([
          '/fixtures/echo',
          '/fixtures/http_methods',
          '/fixtures'
        ])
      })

      /**
       * Tests sending a json object from a client to the server, and echoing it
       * back to the client.
       */
      it('must send/receive JSON data over HTTP', function () {
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

      /**
       * Ensures the client is still connected after the tests
       */
      it('must have an open websocket connection', function () {
        expect(client.isConnected).to.equal(true)
      })
    })

    /**
     * Expected errors and pathological cases
     */
    describe('Error Handling', function () {
      it('must return 404 for unknown/unexpected endpoints', function () {
        const args = { method: 'GET', path: '/fixtures/unknown/endpoint' }
        return client._request(args)
          .then(json => { throw new Error('unexpected success!') })
          .catch(err => {
            expect(err).to.be.an.instanceof(Error)
            expect(err.message).to.be.a('string')
            expect(err.message).to.equal('unexpected status code 404')
          })
      })

      it('must return 405 for unknown/unexpected HTTP methods', function () {
        const args = { method: 'PUT', path: '/fixtures/http_methods' }
        return client._request(args)
          .then(json => { throw new Error('unexpected success!') })
          .catch(err => {
            expect(err).to.be.an.instanceof(Error)
            expect(err.message).to.be.a('string')
            expect(err.message).to.equal('unexpected status code 405')
          })
      })
    })
  })
})
