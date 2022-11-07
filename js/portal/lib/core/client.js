/**
 * @file An HTTP client implementation
 */

const { EventEmitter } = require('events')
const http = require('http')
const Websocket = require('ws')

/**
 * Exports an implementation of a client
 * @type {Client}
 */
module.exports = class Client extends EventEmitter {
  constructor (props = {}) {
    super()

    this.hostname = props.hostname || 'localhost'
    this.port = props.port || 80
    this.pathname = props.pathname || '/api/v1/updates'
    this.websocket = null

    Object.seal(this)
  }

  /**
   * Returns whether or not the client is connected to the server
   * @returns {Boolean}
   */
  get isConnected () {
    return (this.websocket != null) && (this.websocket.readyState === 1)
  }

  /**
   * Opens a connection to the server
   * @returns {Promise<Void>}
   */
  connect () {
    return new Promise((resolve, reject) => {
      const url = `ws://${this.hostname}:${this.port}${this.pathname}`
      const ws = new Websocket(url)

      this.websocket = ws
        .on('message', (...args) => this._onMessage(...args))
        .once('open', () => { this.emit('connected'); resolve() })
        .once('close', () => { this.websocket = null })
        .once('error', reject)
    })
  }

  /**
   * Closes the connection to the server
   * @returns {Promise<Void>}
   */
  disconnect () {
    return new Promise((resolve, reject) => this.websocket
      .once('error', reject)
      .once('close', () => { this.emit('disconnected'); resolve() })
      .close())
  }

  /**
   * Adds a limit order to the orderbook
   * @param {Object} order The limit order to add the orderbook
   */
  submitLimitOrder (order) {
    return this._request({
      method: 'PUT',
      path: '/api/v1/orderbook/limit'
    }, {
      uid: order.uid,
      type: order.type,
      side: order.side,
      hash: order.hash,
      baseAsset: order.baseAsset,
      baseNetwork: order.baseNetwork,
      baseQuantity: order.baseQuantity,
      quoteAsset: order.quoteAsset,
      quoteNetwork: order.quoteNetwork,
      quoteQuantity: order.quoteQuantity
    })
  }

  /**
   * Adds a limit order to the orderbook
   * @param {Object} order The limit order to delete the orderbook
   */
  cancelLimitOrder (order) {
    return this._request({
      method: 'DELETE',
      path: '/api/v1/orderbook/limit'
    }, {
      id: order.id,
      baseAsset: order.baseAsset,
      quoteAsset: order.quoteAsset
    })
  }

  /**
   * Performs an HTTP request and returns the response
   * @param {Object} args Arguments for the operation
   * @param {Object} [data] Data to be sent as part of the request
   * @returns {Promise<Object>}
   */
  _request (args, data) {
    return new Promise((resolve, reject) => {
      const buf = (data && JSON.stringify(data)) || ''
      const req = http.request(Object.assign(args, {
        hostname: this.hostname,
        port: this.port,
        headers: Object.assign(args.headers || {}, {
          accept: 'application/json',
          'accept-encoding': 'application/json',
          'content-type': 'application/json',
          'content-length': Buffer.byteLength(buf),
          'content-encoding': 'identity'
        })
      }))

      req
        .once('abort', () => reject(new Error('aborted')))
        .once('error', err => reject(err))
        .once('response', res => {
          const { statusCode } = res
          const contentType = res.headers['content-type']

          if (statusCode !== 200 && statusCode !== 400) {
            return reject(new Error(`unexpected status code ${statusCode}`))
          } else if (!contentType.startsWith('application/json')) {
            return reject(new Error(`unexpected content-type ${contentType}`))
          } else {
            const chunks = []
            res
              .on('data', chunk => chunks.push(chunk))
              .once('error', err => reject(err))
              .once('end', () => {
                const str = Buffer.concat(chunks).toString('utf8')
                let obj = null

                try {
                  obj = JSON.parse(str)
                } catch (err) {
                  return reject(new Error(`malformed JSON response "${str}"`))
                }

                statusCode === 200
                  ? resolve(obj)
                  : reject(new Error(obj.message))
              })
          }
        })
        .end(buf)
    })
  }

  /**
   * Send data to the server
   * @param {Object} obj The object to send
   * @returns {Promise<Void>}
   */
  _send (obj) {
    return new Promise((resolve, reject) => {
      const buf = Buffer.from(JSON.stringify(obj))
      const opts = { binary: false }
      this.websocket.send(buf, opts, err => err ? reject(err) : resolve())
    })
  }

  /**
   * Handles incoming websocket messages
   * @param {Buffer|Object} data The data received over the websocket
   * @returns {Void}
   */
  _onMessage (data) {
    let event, arg
    try {
      event = 'message'
      arg = JSON.parse(data)
    } catch (err) {
      event = 'error'
      arg = err
    } finally {
      this.emit(event, arg)
    }
  }
}
