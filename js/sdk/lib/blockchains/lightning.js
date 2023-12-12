/**
 * @file Interface to the Lightning network
 */

const { Blockchain } = require('@portaldefi/core')
const https = require('https')
const { URL } = require('url')
const WebSocket = require('ws')

/**
 * Holds private fields for instances of the class
 * @type {WeakMap}
 */
const INSTANCES = new WeakMap()

/**
 * Returns the base64url encoding of the specified secret hash
 * @param {String} hash The secret hash to encode
 * @returns {String}
 */
function encodeHash (hash) {
  return Buffer.from(hash, 'hex')
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
}

/**
 * Interface to the Lightning network
 * @type {Lightning}
 */
module.exports = class Lightning extends Blockchain {
  constructor (sdk, props) {
    super({ id: 'lightning' })

    if (props == null) {
      throw Error('no properties specified!')
    } else if (props.hostname == null || typeof props.hostname !== 'string') {
      throw Error('no hostname specified for lnd!')
    } else if (props.port == null || typeof props.port !== 'number') {
      throw Error('no port specified for lnd!')
    } else if (props.cert == null || typeof props.cert !== 'string') {
      throw Error('no TLS certificate specified!')
    } else if (props.admin == null || typeof props.admin !== 'string') {
      throw Error('no admin macaroon provided!')
    } else if (props.invoice == null || typeof props.invoice !== 'string') {
      throw Error('no invoice macaroon provided!')
    }

    INSTANCES.set(this, Object.seal({
      hostname: props.hostname,
      port: props.port,
      cert: props.cert,
      macaroons: {
        admin: props.admin,
        invoice: props.invoice
      },
      sockets: new Set(),
      wallet: null,
      json: {
        hostname: props.hostname,
        port: props.port,
        publicKey: null,
        cert: `${props.cert.substr(0, 6)}******`,
        admin: `${props.admin.substr(0, 6)}******`,
        invoice: `${props.invoice.substr(0, 6)}******`
      }
    }))

    Object.freeze(this)
  }

  /**
   * Returns the hostname of the LND instance
   * @returns {String}
   */
  get hostname () {
    return INSTANCES.get(this).json.hostname
  }

  /**
   * Returns the port of the LND instance
   * @returns {Number}
   */
  get port () {
    return INSTANCES.get(this).json.port
  }

  /**
   * Returns the publicKey of the LND instance
   * @returns {String}
   */
  get publicKey () {
    return INSTANCES.get(this).json.publicKey
  }

  /**
   * Returns the JSON representation of the swap
   * @returns {Object}
   */
  toJSON () {
    return Object.assign(super.toJSON(), INSTANCES.get(this).json)
  }

  /**
   * Connects to the LND daemon and retrieves basic information about the node
   * @returns {Promise<Void>}
   */
  async connect () {
    const info = await this._getInfo()
    INSTANCES.get(this).json.publicKey = info.publicKey
    this.info('connect', this)
    this.emit('connect', this)
    return this
  }

  /**
   * Creates a HODL Invoice
   * @param {Party} party The party that will pay the invoice
   * @param {Number} party.quantity The number of tokens to be invoiced
   * @param {Swap} party.swap The parent swap of the party
   * @param {String} party.swap.secretHash The hash of the secret of the swap
   * @returns {Promise<String>} The BOLT-11 Payment Request
   */
  async createInvoice (party) {
    try {
      const invoice = await this._createHodlInvoice(party)
      this.info('createInvoice', invoice, this)
      return invoice
    } catch (err) {
      this.error('createInvoice', err, party, this)
      throw err
    }
  }

  /**
   * Pays a HODL Invoice
   * @param {Party} party The party that is paying the invoice
   * @param {Number} party.invoice The invoice to be paid
   * @returns {Promise<Object>}
   */
  async payInvoice (party) {
    try {
      // decode and validate the payment request
      const paymentRequest = await this._decodePaymentRequest(party)
      if (paymentRequest.id !== party.swap.secretHash) {
        const expected = party.swap.secretHash
        const actual = paymentRequest.id
        throw Error(`expected swap hash "${expected}"; got "${actual}"`)
      } else if (paymentRequest.swap.id !== party.swap.id) {
        const expected = party.swap.id
        const actual = paymentRequest.swap.id
        throw Error(`expected swap identifier "${expected}"; got "${actual}"`)
      } else if (paymentRequest.amount !== party.quantity) {
        const expected = party.quantity
        const actual = paymentRequest.amount
        throw Error(`expected swap quantity "${expected}"; got "${actual}"`)
      }

      // pay the invoice
      const receipt = await this._payViaPaymentRequest(party)
      this.info('payInvoice', receipt, party, this)
      return receipt
    } catch (err) {
      this.error('payInvoice', err, party, this)
      throw err
    }
  }

  /**
   * Settles the HODL invoice
   * @param {Party} party The party that is settling the invoice
   * @param {Number} party.invoice The invoice to be settled
   * @param {String} secret The secret to be revealed during settlement
   * @returns {Promise<Object>}
   */
  async settleInvoice (party, secret) {
    try {
      const receipt = await this._settleHodlInvoice(secret)
      this.info('settleInvoice', receipt, party, this)
      return receipt
    } catch (err) {
      this.error('settleInvoice', err, party, this)
      throw err
    }
  }

  /**
   * Gracefully disconnects from the network
   * @returns {Promise<Lightning>}
   */
  async disconnect () {
    const state = INSTANCES.get(this)

    for (const socket of state.sockets) {
      await socket.close()
    }

    this.info('disconnect', this)
    this.emit('disconnect', this)
    return this
  }

  /**
   * Returns information about the LND node
   * @returns {Promise<Object>}
   */
  async _getInfo () {
    const state = INSTANCES.get(this)
    const args = {
      path: '/v1/getinfo',
      method: 'GET',
      headers: { 'Grpc-Metadata-macaroon': state.macaroons.admin }
    }
    const info = await this._request(args)
    return { publicKey: info.identity_pubkey }
  }

  /**
   * Creates a HODL invoice through the LND node
   * @param {Party} party The party that will pay the invoice
   * @returns {Promise<Invoice>}
   */
  _createHodlInvoice (party) {
    return new Promise((resolve, reject) => {
      const state = INSTANCES.get(this)
      const { hostname, port, sockets } = state

      const { swap, quantity } = party
      const { id, secretHash } = swap
      const args = {
        path: '/v2/invoices/hodl',
        method: 'POST',
        headers: { 'Grpc-Metadata-macaroon': state.macaroons.invoice }
      }
      const data = {
        memo: id,
        hash: encodeHash(secretHash),
        value: quantity
      }

      this._request(args, data)
        .then(invoice => {
          const url = new URL(`wss://${hostname}:${port}/v2/invoices/subscribe/${data.hash}?method=GET`)
          const opts = {
            headers: { 'Grpc-Metadata-macaroon': state.macaroons.invoice },
            // TODO: Fix this for production use
            rejectUnauthorized: false
          }

          ;(function subscribe (attempt, self) {
            const ws = new WebSocket(url.toString(), opts)
              .on('open', () => sockets.add(ws))
              .on('close', (...args) => sockets.delete(ws))
              .on('error', err => {
                sockets.delete(ws)
                self.emit('error', err, self)
              })
              .on('message', buf => {
                let obj = null

                // parse the message
                try {
                  obj = JSON.parse(buf)
                } catch (err) {
                  self.error('invoice.error', err, self)
                  return
                }

                self.debug('invoice', obj, self)
                if (obj.result == null) {
                  if (obj.code === 5 && obj.message === 'Not Found') {
                    ws.close()
                    setTimeout(() => subscribe(++attempt, self), 100)
                  } else {
                    self.error('invoice.error', Error(obj.message), self)
                  }
                  return
                }

                // generate an invoice from the update
                const invoice = {
                  id: Buffer.from(obj.result.r_hash, 'base64').toString('hex'),
                  ts: obj.result.creation_date * 1000,
                  swap: { id: obj.result.memo },
                  request: obj.result.payment_request,
                  amount: Number(obj.result.value)
                }

                // process the invoice event
                switch (obj.result.state) {
                  case 'OPEN':
                    self.info('invoice.created', invoice, self)
                    self.emit('invoice.created', invoice, self)
                    resolve(invoice)
                    break

                  case 'ACCEPTED':
                    self.info('invoice.paid', invoice, self)
                    self.emit('invoice.paid', invoice, self)
                    break

                  case 'SETTLED':
                    self.info('invoice.settled', invoice, self)
                    self.emit('invoice.settled', invoice, self)
                    break

                  case 'CANCELLED':
                    self.info('invoice.cancelled', invoice, self)
                    self.emit('invoice.cancelled', invoice, self)
                    break

                  default:
                    self.warn('invoice.unknown', obj.result, self)
                }
              })
          }(0, this))
        })
    })
  }

  /**
   * Decodes the specified BOLT-11 payment request
   * @param {Party} party The party that is paying the invoice
   * @returns {Promise<Receipt>}
   */
  async _decodePaymentRequest (party) {
    const args = {
      path: `/v1/payreq/${party.invoice.request}`,
      method: 'GET',
      headers: {
        'Grpc-Metadata-macaroon': INSTANCES.get(this).macaroons.admin
      }
    }
    const result = await this._request(args)

    return {
      id: result.payment_hash,
      swap: { id: result.description },
      request: party.invoice.request,
      amount: Number(result.num_satoshis)
    }
  }

  /**
   * Pays a HODL invoice using the corresponding BOLT-11 payment request
   * @param {Party} party The party that is paying the invoice
   * @returns {Promise<Receipt>}
   */
  _payViaPaymentRequest (party) {
    return new Promise((resolve, reject) => {
      const state = INSTANCES.get(this)
      const { hostname, port, sockets, macaroons: { admin } } = state
      const url = `wss://${hostname}:${port}/v2/router/send?method=POST`
      const opts = {
        // TODO: Fix this for production use
        rejectUnauthorized: false,
        headers: { 'Grpc-Metadata-macaroon': admin }
      }

      const ws = new WebSocket(url, opts)
        .on('open', (...args) => {
          const req = {
            payment_request: party.invoice.request,
            timeout_seconds: 120
          }

          ws.send(JSON.stringify(req), err => {
            if (err != null) {
              this.error('payViaPaymentRequest', err, req, party, this)
              this.emit('error', err, req, party, this)
              reject(err)
            } else {
              this.info('payViaPaymentRequest', req, party, this)
              sockets.add(ws)
            }
          })
        })
        .on('error', err => {
          sockets.delete(ws)
          this.error('payViaPaymentRequest', err, party, this)
          this.emit('error', err, party, this)
          reject(err)
        })
        .on('close', () => sockets.delete(ws))
        .on('message', buf => {
          let obj = null

          // parse the message
          try {
            obj = JSON.parse(buf)

            if (obj.error != null) {
              const err = Error(obj.error.message)
              err.code = obj.error.code
              throw err
            }
          } catch (err) {
            this.error('payViaPaymentRequest', err, party, this)
            this.emit('error', err, party, this)
            return reject(err)
          }

          // generate a payment from the update
          this.debug('payViaPaymentRequest', obj, party, this)
          const payment = {
            id: obj.result.payment_hash,
            swap: { id: party.swap.id },
            request: obj.result.payment_request,
            amount: Number(obj.result.value)
          }

          switch (obj.result.status) {
            case 'IN_FLIGHT':
              if (obj.result.htlcs && obj.result.htlcs.length) {
                resolve(payment)
              }
              break

            case 'SUCCEEDED':
              this.info('payViaPaymentRequest', obj, party, this)
              ws.close()
              break

            case 'FAILED':
              this.error('payViaPaymentRequest', obj, party, this)
              ws.close()
              break

            default:
              this.warn('payViaPaymentRequest', obj, party, this)
          }
        })
    })
  }

  /**
   * Settles a HODL invoice
   * @param {String} secret The secret to be revealed during settlement
   * @returns {Promise}
   */
  async _settleHodlInvoice (secret) {
    const args = {
      path: '/v2/invoices/settle',
      method: 'POST',
      headers: {
        'Grpc-Metadata-macaroon': INSTANCES.get(this).macaroons.invoice
      }
    }

    return this._request(args, {
      preimage: Buffer.from(secret, 'hex').toString('base64')
    })
  }

  _request (args, data) {
    return new Promise((resolve, reject) => {
      const { hostname, port } = INSTANCES.get(this)
      const reqArgs = Object.assign(args, {
        hostname,
        port,
        rejectUnauthorized: false // TODO: Fix this for production use
      })
      const req = https.request(reqArgs)

      req
        .once('abort', () => reject(Error('aborted')))
        .once('error', err => reject(err))
        .once('response', res => {
          const chunks = []
          res
            .on('data', chunk => chunks.push(chunk))
            .once('error', err => reject(err))
            .once('end', () => {
              const str = Buffer.concat(chunks).toString('utf8')

              try {
                const obj = JSON.parse(str)

                if (res.statusCode === 200) {
                  resolve(obj)
                } else {
                  const err = Error(obj.message)
                  this.error('_request', reqArgs, {
                    statusCode: res.statusCode,
                    headers: res.headers
                  }, err)
                  reject(err)
                }
              } catch (err) {
                reject(Error(`malformed JSON response "${str}"`))
              }
            })
        })

      if (data != null) {
        req.end(Buffer.from(JSON.stringify(data)))
      } else {
        req.end()
      }
    })
  }
}
