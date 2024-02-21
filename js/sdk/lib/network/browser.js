/**
 * @file Network implementation for the browser
 */

const { BaseClass } = require('@portaldefi/core')

/**
 * Network implementation for the browser
 * @type {Network}
 */
module.exports = class Network extends BaseClass {
  constructor (props) {
    props = Object.assign({
      hostname: 'localhost',
      port: 80,
      pathname: '/api/v1/updates'
    }, props)

    super()

    this.hostname = props.hostname
    this.port = props.port
    this.pathname = props.pathname
    this.websocket = null

    Object.seal(this)
  }

  /**
   * Returns whether or not the SDK instance is connected to the server
   * @returns {Boolean}
   */
  get isConnected () {
    return (this.websocket != null) && (this.websocket.readyState === 1)
  }

  /**
   * Returns the JSON representation of this instance
   * @returns {Object}
   */
  toJSON () {
    return Object.assign(super.toJSON(), {
      hostname: this.hostname,
      port: this.port,
      pathname: this.pathname
    })
  }

  /**
   * Connects to the peer network.
   *
   * A websocket connection is established with the remote peer. The connection
   * is currently authenticated by an identifier of the user.
   * @returns {Promise<Void>}
   */
  connect () {
    return new Promise((resolve, reject) => {
      const url = `ws://${this.hostname}:${this.port}${this.pathname}/${this.id}`
      const ws = new WebSocket(url) /* eslint-disable-line no-undef */
      ws.onmessage = (...args) => this._onMessage(...args)
      ws.onopen = () => { this.emit('connected'); resolve() }
      ws.onclose = () => { this.websocket = null; this.emit('disconnected') }
      ws.onerror = reject
      this.websocket = ws
    })
  }

  /**
   * Performs an HTTP request and returns the response
   * @param {Object} args Arguments for the operation
   * @param {Object} [data] Data to be sent as part of the request
   * @returns {Promise<Object>}
   */
  request (args, data) {
    return new Promise((resolve, reject) => {
      const creds = `${this.id}:${this.id}`
      const buf = (data && JSON.stringify(data)) || ''
      const req = fetch(args.path, Object.assign(args, {
        headers: Object.assign(args.headers || {}, {
          /* eslint-disable quote-props */
          'accept': 'application/json',
          'accept-encoding': 'application/json',
          'authorization': `Basic ${Buffer.from(creds).toString('base64')}`,
          'content-type': 'application/json',
          'content-length': Buffer.byteLength(buf),
          'content-encoding': 'identity'
          /* eslint-enable quote-props */
        }),
        body: buf
      }))

      req
        .then(res => {
          const { status } = res
          const contentType = res.headers.get('Content-Type')

          if (status !== 200 && status !== 400) {
            reject(new Error(`unexpected status code ${status}`))
          } else if (!contentType.startsWith('application/json')) {
            reject(new Error(`unexpected content-type ${contentType}`))
          } else {
            res.json()
              .then(obj => status === 200
                ? resolve(obj)
                : reject(Error(obj.message)))
              .catch(reject)
          }
        })
        .catch(reject)
    })
  }

  /**
   * Send data to the server
   * @param {Object} obj The object to send
   * @returns {Promise<Void>}
   */
  send (obj) {
    return new Promise((resolve, reject) => {
      const buf = Buffer.from(JSON.stringify(obj))
      const opts = { binary: false }
      this.websocket.send(buf, opts, err => err ? reject(err) : resolve())
    })
  }

  /**
   * Closes the connection to the server
   * @returns {Promise<Void>}
   */
  disconnect () {
    return new Promise((resolve, reject) => {
      const ws = this.websocket
      ws.onerror = reject
      ws.onclose = resolve
      ws.close()
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
      arg = JSON.parse(data)

      if (arg['@type'] != null && arg.status != null) {
        event = `${arg['@type'].toLowerCase()}.${arg.status}`
        arg = [arg]
      } else if (arg['@event'] != null && arg['@data'] != null) {
        event = arg['@event']
        arg = arg['@data']
      } else {
        event = 'message'
        arg = [arg]
      }
    } catch (err) {
      event = 'error'
      arg = err
    } finally {
      this.emit(event, ...arg)
    }
  }
}
