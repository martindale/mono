/**
 * @file An HTTP server implementation
 */

const { EventEmitter } = require('events')
const http = require('http')

/**
 * A weak-map storing private data for each instance of the class
 * @type {WeakMap}
 */
const INSTANCES = new WeakMap()

/**
 * Exports an implementation of a server
 * @type {Server}
 */
module.exports = class Server extends EventEmitter {
  constructor (props = {}) {
    super()

    INSTANCES.set(this, Object.seal({
      hostname: props.hostname || process.env.PORTAL_HTTP_HOSTNAME || 'localhost',
      port: props.port || process.env.PORTAL_HTTP_PORT || 0,
      api: require('./api')(props.api || process.env.PORTAL_HTTP_API),
      ctx: require('./context'),
      server: http.createServer({
        IncomingMessage: HttpRequest,
        ServerResponse: HttpResponse
      })
    }))

    Object.seal(this)
  }

  /**
   * Returns the hostname/IP address of the interface the server is listening on
   * @returns {String}
   */
  get hostname () {
    return INSTANCES.get(this).hostname
  }

  /**
   * Returns the port the server is listening on
   * @returns {Number}
   */
  get port () {
    return INSTANCES.get(this).port
  }

  /**
   * Returns the port the server is listening on
   * @returns {Number}
   */
  get endpoints () {
    return Object.keys(INSTANCES.get(this).api)
  }

  /**
   * Returns the current state of the server as a JSON string
   * @type {String}
   */
  [Symbol.for('nodejs.util.inspect.custom')] () {
    return this.toJSON()
  }

  /**
   * Returns the JSON representation of the instance
   * @returns {Object}
   */
  toJSON () {
    const { hostname, port } = INSTANCES.get(this)
    return { hostname, port }
  }

  /**
   * Starts the server
   * @returns {Promise<Server>}
   */
  start () {
    const instance = INSTANCES.get(this)

    return new Promise((resolve, reject) => instance.server
      .once('error', reject)
      .once('listening', () => {
        instance.port = instance.server.address().port
        instance.server
          .removeListener('error', reject)
          .on('error', err => this.emit('error', err))
          .on('request', (req, res) => this._onRequest(req, res))

        this.emit('start', this)
        resolve(this)
      })
      .listen(instance.port, instance.hostname))
  }

  /**
   * Stops the server
   * @returns {Promise<Void>}
   */
  stop () {
    const instance = INSTANCES.get(this)

    return new Promise((resolve, reject) => instance.server
      .once('error', reject)
      .once('close', () => {
        this.emit('stop', this)
        resolve()
      })
      .close())
  }

  /**
   * Handles an incoming HTTP request
   * @param {IncomingMessage} req The incoming HTTP request
   * @param {ServerResponse} res The outgoing HTTP response
   * @returns {Void}
   */
  _onRequest (req, res) {
    // If the request errors, then handle the response to the client
    req.once('error', () => {
      if (!res.destroyed && !res.headersSent) {
        res.statusCode = 500
        res.end()
      }
    })

    // Emit all request/response errors as logs
    req.on('error', err => this.emit('log', 'error', err, req, res))
    res.on('error', err => this.emit('log', 'error', err, req, res))

    // Parse the URL and stash it for later use
    req.parsedUrl = new URL(req.url, `http://${req.headers.host}`)

    // Collect the incoming HTTP body
    const chunks = []
    req
      .on('data', chunk => chunks.push(chunk))
      .once('end', () => {
        // Parse any incoming JSON object and stash it at req.json for later use
        const str = Buffer.concat(chunks).toString('utf8')

        if (str === '') {
          req.json = null
        } else {
          try {
            req.json = JSON.parse(str)
          } catch (e) {
            const err = new Error(`unexpected non-JSON response ${str}`)
            res.send(err)
            this.emit('log', 'error', err, req, res)
            return
          }
        }

        // Route the request
        const { api, ctx } = INSTANCES.get(this)

        // Parse the path components in reverse order until a match is obtained
        let route = req.parsedUrl.pathname
        let routed = !!api[route]
        while (!routed && route.length > 0) {
          route = route.slice(0, route.lastIndexOf('/'))
          routed = !!api[route]
        }

        // If no route exists, then return 404 Not Found
        if (!routed) {
          res.statusCode = 404
          return res.end()
        }

        // Execute the request handler or return an appropriate error
        const handler = api[route]
        if (typeof handler === 'function') {
          handler(req, res, ctx)
        } else if (typeof handler[req.method] === 'function') {
          handler[req.method](req, res, ctx)
        } else {
          res.statusCode = 405
          res.end()
        }
      })
  }
}

/**
 * A wrapper to improve debugging
 * @extends IncomingMessage
 */
class HttpRequest extends http.IncomingMessage {
  /**
   * Returns the current state of the instance
   * @type {String}
   */
  [Symbol.for('nodejs.util.inspect.custom')] () {
    return this.toJSON()
  }

  /**
  * Returns the current state of the instance
  * @returns {Object}
  */
  toJSON () {
    return {
      type: this.constructor.name,
      method: this.method,
      url: this.url,
      headers: this.headers
    }
  }
}

/**
 * A wrapper to improve debugging
 * @extends ServerResponse
 */
class HttpResponse extends http.ServerResponse {
  /**
   * Returns the current state of the instance
   * @type {String}
   */
  [Symbol.for('nodejs.util.inspect.custom')] () {
    return this.toJSON()
  }

  /**
  * Returns the current state of the instance
  * @returns {Object}
  */
  toJSON () {
    return {
      type: this.constructor.name,
      statusCode: this.statusCode,
      headers: this.headers
    }
  }

  /**
   * Sends the specified data to the socket and ends the response
   * @param {Error|Object} data The data to be sent
   * @returns {Void}
   */
  send (data) {
    const buf = data instanceof Error
      ? JSON.stringify({ message: data.message })
      : JSON.stringify(data)

    this.statusCode = data instanceof Error ? 400 : 200

    this.setHeader('content-type', 'application/json')
    this.setHeader('content-length', Buffer.byteLength(buf))
    this.setHeader('content-encoding', 'identity')
    this.end(buf)
  }
}
