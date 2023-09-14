/**
 * @file The Lightning network
 */

const Network = require('../core/network')
const ln = require('lightning')
const debug = require('debug')('network:lightning')

/**
 * Exports an interface to the Lightning blockchain network
 * @type {Lightning}
 */
module.exports = class Lightning extends Network {
  constructor (props) {
    super({ name: props.name, assets: props.assets })
    Object.seal(this)
  }

  /**
   * Opens the swap on behalf of one of the parties
   *
   * This method creates a HodlInvoice for the calling party, and saves it into
   * counterparty's state-bag.
   *
   * For a SecretHolder, it sets up additional event-triggered machinery to pay
   * the SecretSeeker's invoice
   *
   * @param {Party} party The party that is opening the swap
   * @param {Object} opts Options for the operation
   * @param {Object} opts.lightning Arguments used to connect to LND
   * @param {String} opts.lightning.cert TLS certificate used to connect to LND
   * @param {String} opts.lightning.invoice The invoice macaroon used with LND
   * @param {String} opts.lightning.socket The URL to the LND daemon
   * @param {String} [opts.secret] The secret used by the SecretHolder
   * @returns {Promise<Party>}
   */
  async open (party, opts) {
    // Requests are made using the Invoice macaroon for both parties
    const grpc = ln.authenticatedLndGrpc({
      cert: opts.lightning.cert,
      macaroon: opts.lightning.invoice,
      socket: opts.lightning.socket
    })

    // Invoices are for the quantity of tokens specified by the counterparty
    const args = Object.assign(grpc, {
      id: party.swap.secretHash,
      tokens: party.counterparty.quantity
    })

    try {
      // Newly created invoices are saved into the Counterparty's state-bag
      debug(party.id, `is creating an ${this.name} invoice`)
      const invoice = await ln.createHodlInvoice(args)
      debug(party.id, `created a ${this.name} invoice`, invoice)
      party.counterparty.state[this.name] = { invoice }
    } catch (err) {
      debug(party.id, 'createHodlInvoice', err)
      if (err instanceof Array) {
        // ln errors are arrays with 3 elements
        // 0: Numeric error code (HTTP status code)
        // 1: String error code
        // 2: JSON object with an `err` property
        throw Error(err[2].err.details)
      } else {
        throw err
      }
    }

    if (party.isSecretSeeker) {
      // no-op
    } else if (party.isSecretHolder) {
      // For the SecretHolder, setup subscription(s) to auto-settle the invoice
      try {
        const subscription = await ln.subscribeToInvoice(args)
        subscription.on('invoice_updated', invoice => {
          if (invoice.is_held) {
            invoice.secret = opts.secret
            ln.settleHodlInvoice(opts)
          }
        })
      } catch (err) {
        debug(party.id, '(secretHolder) subscribeToInvoice', err)
        if (err instanceof Array) {
          // ln errors are arrays with 3 elements
          // 0: Numeric error code (HTTP status code)
          // 1: String error code
          // 2: JSON object with an `err` property
          throw Error(err[2].err.details)
        } else {
          throw err
        }
      }
    } else {
      throw Error('multi-party swaps are not supported!')
    }

    return party
  }

  /**
   * Commits a swap on behalf of one of the parties
   *
   * The SecretSeeker listens for a payment from the SecretHolder against their
   * previously created invoice (in the .open() above), that moves the invoice
   * into the "held" state. This triggers payment of the SecretHolder's invoice
   * created by the SecretHolder (in their .open() call) on the network where
   * the SecretSeeker holds their funds.
   *
   * @param {Party} party The party that is committing the swap
   * @param {Object} opts Options for the operation
   * @param {Object} opts.lightning Arguments used to connect to LND
   * @param {String} opts.lightning.cert TLS certificate used to connect to LND
   * @param {String} opts.lightning.invoice The invoice macaroon used with LND
   * @param {String} opts.lightning.socket The URL to the LND daemon
   * @returns {Promise<Party>}
   */
  async commit (party, opts) {
    if (party.isSecretSeeker) {
      // This request is made through the SecretSeeker's LND node
      const grpc = ln.authenticatedLndGrpc({
        cert: opts.lightning.cert,
        macaroon: opts.lightning.invoice,
        socket: opts.lightning.socket
      })
      const args = Object.assign(grpc, {
        id: party.counterparty.state[this.name].invoice.id
      })

      debug(party.id, '(secretSeeker) subscribing to invoice')
      const subscription = await ln.subscribeToInvoice(args)
      subscription.on('invoice_updated', async invoice => {
        if (invoice.is_held) {
          const secretString = await party.network.commit(party, opts)
            .catch(err => console.log(`\n\n\n${this.name}.commit`, party, err))
          const secret = secretString.toString(16)
          debug(party.id, '(secretSeeker) got secret', secret)
          debug(party.id, '(secretSeeker) settling invoice now...')

          try {
            await ln.settleHodlInvoice(Object.assign({ secret }, grpc))
            debug(party.id, '(secretSeeker) settled invoice')
          } catch (err) {
            debug(party.id, '(secretHolder) settleHodlInvoice', err)
            if (err instanceof Array) {
              // ln errors are arrays with 3 elements
              // 0: Numeric error code (HTTP status code)
              // 1: String error code
              // 2: JSON object with an `err` property
              throw Error(err[2].err.details)
            } else {
              throw err
            }
          }
        }
      })
      debug(party.id, '(secretSeeker) subscribed to invoice')
    } else if (party.isSecretHolder) {
      const grpc = ln.authenticatedLndGrpc({
        cert: opts.lightning.cert,
        macaroon: opts.lightning.admin,
        socket: opts.lightning.socket
      })
      const args = Object.assign(grpc, {
        request: party.state[party.network.name].invoice.request
      })

      // Validate the SecretSeeker's invoice
      let holderPaymentRequest

      try {
        debug(party.id, '(secretHolder) decoding payment request')
        holderPaymentRequest = await ln.decodePaymentRequest(args)
        debug(party.id, '(secretHolder) decoded payment request', holderPaymentRequest)
      } catch (err) {
        debug(party.id, '(secretHolder) decodePaymentRequest', err)
        if (err instanceof Array) {
          // ln errors are arrays with 3 elements
          // 0: Numeric error code (HTTP status code)
          // 1: String error code
          // 2: JSON object with an `err` property
          throw Error(err[2].err.details)
        } else {
          throw err
        }
      }

      if (holderPaymentRequest.id !== party.swap.secretHash) {
        debug(party.id, '(secretHolder) decodePaymentRequest', 'unexpected swap hash!')
        throw Error('unexpected swap hash!')
      }

      // Pay the SecretSeeker's invoice
      try {
        debug(party.id, '(secretHolder) paying invoice...')
        await ln.payViaPaymentRequest(args)
      } catch (err) {
        debug(party.id, '(secretHolder) payViaPaymentRequest', err)
        if (err instanceof Array) {
          // ln errors are arrays with 3 elements
          // 0: Numeric error code (HTTP status code)
          // 1: String error code
          // 2: JSON object with an `err` property
          if (err.length < 3) {
            throw Error(err[1])
          } else {
            throw Error(err[2].err.details)
          }
        } else {
          throw err
        }
      }
    } else {
      throw Error('multi-party swaps are not supported!')
    }

    return party
  }
}
