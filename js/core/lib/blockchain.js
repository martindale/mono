/**
 * @file A base class for all supported blockchains
 */

const BaseClass = require('./base_class')

/**
 * A base class for all blockchains
 * @type {Blockchain}
 */
module.exports = class Blockchain extends BaseClass {
  constructor (props) {
    if (props == null) {
      throw Error('no properties specified!')
    } else if (props.id == null || typeof props.id !== 'string') {
      throw Error(`expected props.id to be a string; got "${typeof props.id}"!`)
    }

    super({ id: props.id })
  }

  /**
   * Connects to the blockchain daemon
   * @returns {Promise<Void>}
   */
  async connect () {
    throw Error('not implemented!')
  }

  /**
   * Creates an invoice
   * @returns {Promise<Invoice>} The newly created invoice
   */
  async createInvoice (party) {
    throw Error('not implemented!')
  }

  /**
   * Pays an invoice
   * @returns {Promise<Invoice>} The invoice to be paid
   */
  async payInvoice (party) {
    throw Error('not implemented!')
  }

  /**
   * Settles the invoice
   * @returns {Promise<Invoice>} The invoice to settle
   */
  async settleInvoice (party, secret) {
    throw Error('not implemented!')
  }

  /**
   * Disconnects from the blockchain daemon
   * @returns {Promise<Blockchain>}
   */
  async disconnect () {
    throw Error('not implemented!')
  }
}
