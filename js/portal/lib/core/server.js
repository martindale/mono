/**
 * @file An HTTP server implementation
 */

const { BaseClass } = require('@portaldefi/core')
const { createReadStream, stat } = require('fs')
const http = require('http')
const mime = require('mime')
const { join, normalize } = require('path')
const { URL } = require('url')
const { WebSocketServer } = require('ws')

/**
 * A weak-map storing private data for each instance of the class
 * @type {WeakMap}
 */
const INSTANCES = new WeakMap()

/**
 * Exports an implementation of a server
 * @type {Server}
 */
module.exports = class Server extends BaseClass {
  constructor (props = {}) {
    super({ id: props.id || 'server' })

    Object.seal(this)

    const env = process.env
    const hostname = props.hostname || env.PORTAL_HTTP_HOSTNAME || 'localhost'
    const port = props.port || env.PORTAL_HTTP_PORT || 0
    const api = require('./api')(props.api || env.PORTAL_HTTP_API)
    const root = props.root || env.PORTAL_HTTP_ROOT
    const ctx = require('./context')
    const server = http.createServer({ IncomingMessage, ServerResponse })
    const websocket = new WebSocketServer({ noServer: true })

    INSTANCES.set(this, { hostname, port, api, root, ctx, server, websocket })

    // Trigger the creation of a swap whenever an order match occurs
    ctx.orderbooks.on('match', (...args) => ctx.swaps.fromOrders(...args))

    // Propagate the log events
    ctx.orderbooks.on('log', (level, ...args) => this[level](...args))
    ctx.swaps.on('log', (level, ...args) => this[level](...args))
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
   * Returns the root directory holding static content to be served
   * @returns {String}
   */
  get root () {
    return INSTANCES.get(this).root
  }

  /**
   * Returns the port the server is listening on
   * @returns {Number}
   */
  get endpoints () {
    return Object.keys(INSTANCES.get(this).api)
  }

  /**
   * Returns whether or not the server is listening for connections
   * @returns {Boolean}
   */
  get isListening () {
    return INSTANCES.get(this).server.listening
  }

  /**
   * Returns the URL of the server
   * @returns {String}
   */
  get url () {
    return `http://${this.hostname}:${this.port}`
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
    const { hostname, port, root } = INSTANCES.get(this)
    return {
      '@type': this.constructor.name,
      hostname,
      port,
      root,
      url: this.url
    }
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
          .on('error', (...args) => this._onError(...args))
          .on('request', (...args) => this._onRequest(...args))
          .on('upgrade', (...args) => this._onUpgrade(...args))

        this.info('start', this)
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
        this.info('stop', this)
        this.emit('stop', this)
        resolve()
      })
      .close())
  }

  /**
   * Handles any errors on the server
   * @param {Error} err The error that occurred
   * @returns {Void}
   */
  _onError (err) {
    this.error('error', err, this)
    this.emit('error', err, this)
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
    req.on('error', err => this.error('request.error', err, req, res))
    res.on('error', err => this.error('response.error', err, req, res))

    // Parse the URL and stash it for later use
    req.parsedUrl = new URL(req.url, `http://${req.headers.host}`)

    // Route the request
    const { api } = INSTANCES.get(this)

    // Parse the path components in reverse order until a match is obtained
    let route = req.parsedUrl.pathname
    let routed = !!api[route]
    while (!routed && route.length > 0) {
      route = route.slice(0, route.lastIndexOf('/'))
      routed = !!api[route]
    }

    if (routed) {
      const handler = api[route]
      if (typeof handler === 'function') {
        req.handler = handler
      } else if (typeof handler[req.method] === 'function') {
        req.handler = handler[req.method]
      } else {
        res.statusCode = (typeof handler.UPGRADE === 'function') ? 404 : 405
        res.end()
        return
      }

      this._handleApi(req, res)
    } else {
      this._handleStatic(req, res)
    }
  }

  /**
   * Handles incoming HTTP upgrade requests
   * @param {HttpRequest} req The client HTTP GET request
   * @param {Socket} socket The network socket between the server and client
   * @param {Buffer} head The first packet of the upgraded stream
   * @returns {Void}
   */
  _onUpgrade (req, socket, head) {
    // Parse the URL and stash it for later use
    req.parsedUrl = new URL(req.url, `http://${req.headers.host}`)
    const { pathname } = req.parsedUrl

    // Parse the client identifier and stash it for later use
    // The authorization header is "Basic <base-64 encoded username:password>"
    // We split out the username and stash it on req.user
    // const auth = req.headers.authorization
    // const [algorithm, base64] = auth.split(' ')
    // const [user, pass] = Buffer.from(base64, 'base64').toString().split(':')
    // req.user = user
    // TODO: Fix this once authentication is figured out
    req.user = pathname.substr(pathname.lastIndexOf('/') + 1)

    // Route the request
    const { api, ctx, websocket } = INSTANCES.get(this)

    // Parse the path components in reverse order until a match is obtained
    let route = req.parsedUrl.pathname
    let routed = !!api[route]
    while (!routed && route.length > 0) {
      route = route.slice(0, route.lastIndexOf('/'))
      routed = !!api[route]
    }

    // If no route exists, then return 404 Not Found
    if (!routed) {
      socket.destroy(Error(`route "${req.parsedUrl.pathname}" not found!`))
      return
    }

    // Execute the request handler or return an appropriate error
    const handler = api[route]
    if (typeof handler.UPGRADE === 'function') {
      websocket.handleUpgrade(req, socket, head, ws => {
        ws.on('close', (code, reason) => {
          reason = reason.toString()
          this.info('ws.close', ws, { code, reason })
        })

        ws.user = req.user

        // Override send to handle serialization and websocket nuances
        ws._send = ws.send
        ws.send = obj => {
          return new Promise((resolve, reject) => {
            const buf = Buffer.from(JSON.stringify(obj))
            const opts = { binary: false }

            this.info('ws.send', ws, obj)
            return ws._send(buf, opts, err => err ? reject(err) : resolve())
          })
        }

        ws.toJSON = function () {
          return { '@type': 'websocket', user: ws.user, route }
        }
        ws[Symbol.for('nodejs.util.inspect.custom')] = function () {
          return this.toJSON()
        }

        this.info('ws.open', ws)
        handler.UPGRADE(ws, ctx)
      })
    } else {
      socket.destroy(Error(`route ${route} does not support UPGRADE!`))
    }
  }

  /**
   * Handles serving API requests
   * @param {IncomingMessage} req The incoming HTTP request
   * @param {ServerResponse} res The outgoing HTTP response
   * @returns {Void}
   */
  _handleApi (req, res) {
    // Parse the client identifier and stash it for later use
    // The authorization header is "Basic <base-64 encoded username:password>"
    // We split out the username and stash it on req.user
    const auth = req.headers.authorization
    if (auth != null) {
      /* eslint-disable-next-line no-unused-vars */
      const [algorithm, base64] = auth.split(' ')
      /* eslint-disable-next-line no-unused-vars */
      const [user, pass] = Buffer.from(base64, 'base64').toString().split(':')
      req.user = user
    }

    // Collect the incoming HTTP body
    const chunks = []
    req
      .on('data', chunk => chunks.push(chunk))
      .once('end', () => {
        // Parse any incoming JSON object and stash it at req.json for later use
        const str = Buffer.concat(chunks).toString('utf8')

        if (str === '') {
          req.json = {}
        } else {
          try {
            req.json = JSON.parse(str)
          } catch (e) {
            const err = new Error(`unexpected non-JSON response ${str}`)
            res.send(err)
            this.error('http.api', err, req, res)
            return
          }
        }

        this.info('http.api', req)

        const { ctx } = INSTANCES.get(this)
        req.handler(req, res, ctx)
      })
  }

  /**
   * Handles serving static content
   * @param {IncomingMessage} req The incoming HTTP request
   * @param {ServerResponse} res The outgoing HTTP response
   * @returns {Void}
   */
  _handleStatic (req, res) {
    // ensure the asset to tbe served exists under the HTTP path
    const { root } = INSTANCES.get(this)
    const pathToAsset = normalize(join(root, req.parsedUrl.pathname))
    if (!pathToAsset.startsWith(root)) {
      // 403 Forbidden
      res.statusCode = 403
      res.end()
      this.error('http.static', req, res)
      return
    }

    // recursive IIFE to serve the actual asset
    const that = this
    ;(function serveAsset (asset) {
      stat(asset, (err, stat) => {
        if (err != null) {
          switch (err.code) {
            case 'EACCES':
            case 'EPERM':
              // 401 Unauthorized
              res.statusCode = 401
              res.end()
              that.emit('log', 'error', 'http.static', req, res)
              return

            case 'EMFILE':
              // 500 Internal Server Error
              // warning: reached max. fd limit!
              // please run "ulimit -n <limit>" to allow opening more files.
              res.statusCode = 500
              res.end()
              that.emit('log', 'error', 'http.static', req, res)
              return

            case 'ENOENT':
            default:
              // 404 Not Found
              res.statusCode = 404
              res.end()
              that.emit('log', 'error', 'http.static', req, res)
              return
          }
        }

        // for directories, recursively serve up index.html
        if (stat.isDirectory()) {
          return serveAsset(join(asset, 'index.html'))
        }

        // symbolic links don't count as they can lead to paths outside of the
        // HTTP path
        if (!stat.isFile()) {
          // 404 Not Found
          res.statusCode = 404
          res.end()
          that.emit('log', 'error', 'http.static', req, res)
          return
        }

        // 200 OK
        res.statusCode = 200
        res.setHeader('content-type', mime.getType(asset))
        res.setHeader('content-length', stat.size)
        res.setHeader('content-encoding', 'identity')
        // that.emit('log', 'info', 'http.static', req, res)

        const fsStream = createReadStream(asset)
          .once('error', err => res.destroyed || res.destroy(err))
          .pipe(res)
          .once('error', err => fsStream.destroyed || fsStream.destroy(err))
      })
    }(pathToAsset))
  }
}

/**
 * A wrapper to improve debugging
 * @extends {IncomingMessage}
 */
class IncomingMessage extends http.IncomingMessage {
  /**
   * Returns the current state of the instance
   * @type {String}
   */
  [Symbol.for('nodejs.util.inspect.custom')] () {
    return this.toJSON()
  }

  /**
   * The unique identifier of the client; returns the HTTP url of the client
   * @returns {String}
   */
  get clientId () {
    const address = this.socket.address()
    return `${address.address}:${address.port}`
  }

  /**
  * Returns the current state of the instance
  * @returns {Object}
  */
  toJSON () {
    const { method, url, headers, json, user } = this
    const obj = { '@type': 'HttpRequest', method, url, headers }
    if (json != null) obj.json = json
    if (user != null) obj.user = user
    return obj
  }
}

/**
 * A wrapper to improve debugging
 * @extends {ServerResponse}
 */
class ServerResponse extends http.ServerResponse {
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
    const { statusCode, json } = this
    const headers = Object.assign({}, this.getHeaders())
    const obj = { '@type': 'HttpResponse', statusCode, headers }
    if (json != null) obj.json = json
    return obj
  }

  /**
   * Sends the specified data to the socket and ends the response
   * @param {Error|Object} data The data to be sent
   * @returns {Void}
   */
  send (data) {
    if (this.headersSent) {
      const level = data instanceof Error ? 'error' : 'info'
      this[level]('http.api', data, this.req, this)
      return
    }

    this.json = data instanceof Error
      ? { message: data.message }
      : data
    this.statusCode = data instanceof Error ? 400 : 200

    const buf = JSON.stringify(this.json)
    this.setHeader('content-type', 'application/json')
    this.setHeader('content-length', Buffer.byteLength(buf))
    this.setHeader('content-encoding', 'identity')
    this.end(buf)
    this.socket.server.emit('log', 'info', 'http.api', this.req, this)
  }
}
