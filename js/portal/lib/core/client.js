/**
 * @file An HTTP client implementation
 */

const { EventEmitter } = require('events')
const http = require('http')

/**
 * Exports an implementation of a client
 * @type {Client}
 */
module.exports = class Client extends EventEmitter {
  constructor (props = {}) {
    super()

    this.hostname = props.hostname || 'localhost'
    this.port = props.port || 80
    this.client = http
    Object.seal(this)
  }

  /**
   * Performs an HTTP request and returns the response
   * @param {Object} args Arguments for the operation
   * @param {Object} data Data to be sent as part of the request
   * @returns {Promise<Object|Buffer|Readable>}
   */
  _request (args, data) {
    return new Promise((resolve, reject) => {
      const buf = JSON.stringify(data)
      const req = this.client.request(Object.assign(args, {
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
          const contentEncoding = res.headers['content-encoding']

          if (statusCode !== 200) {
            const err = new Error(`unexpected status code ${statusCode}`)
            return reject(err)
          } else if (contentType !== 'application/json') {
            const err = new Error(`unexpected content-type ${contentType}`)
            return reject(err)
          } else if (contentEncoding !== 'identity') {
            const err = new Error(`unexpected content-encoding ${contentEncoding}`)
            return reject(err)
          }

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
                return reject(new Error(`unexpected non-JSON response ${str}`))
              }

              resolve(obj)
            })
        })
        .end(buf)
    })
  }
}
