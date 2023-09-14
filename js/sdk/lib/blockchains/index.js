/**
 * @file An interface to all supported blockchains
 */

const { BaseClass } = require('@portaldefi/core')
const Bitcoind = require('./bitcoind')
const Geth = require('./geth')
const Lnd = require('./lnd')

/**
 * Expose the interface to all supported blockchains
 *
 * This class is expected to be a singleton in production-facing scenarios.
 *
 * @type {Blockchains}
 */
module.exports = class Blockchains extends BaseClass {
  constructor (sdk) {
    super()

    this.sdk = sdk

    this.bitcoind = new Bitcoind(this)
    this.geth = new Geth(this)
    this.lnd = new Lnd(this)

    Object.seal(this)
  }

  /**
   * Initializes connections to all supported blockchains
   * @returns {Blockchain[]}
   */
  connect () {
    return Promise.all([
      this.bitcoind.connect(),
      this.geth.connect(),
      this.lnd.connect()
    ])
  }

  /**
   * Gracefully closes connections to all supported blockchains
   * @returns {Blockchain[]}
   */
  disconnect () {
    return Promise.all([
      this.bitcoind.disconnect(),
      this.geth.disconnect(),
      this.lnd.disconnect()
    ])
  }
}
