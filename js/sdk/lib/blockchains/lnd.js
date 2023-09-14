/**
 * @file Interface to the lnd network
 */

const { BaseClass } = require('@portaldefi/core')

module.exports = class Lnd extends BaseClass {
  constructor (blockchains) {
    super()

    this.blockchains = blockchains

    Object.seal(this)
  }

  /**
   * Initializes the bitcoind network connections
   * @returns {Promise<Bitcoind>}
   */
  connect () {
    return Promise.resolve(this)
  }

  /**
   * Gracefully disconnects from the bitcoind network
   * @returns {Promise<Bitcoind>}
   */
  disconnect () {
    return Promise.resolve(this)
  }
}
