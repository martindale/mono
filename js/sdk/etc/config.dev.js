/**
 * @file SDK Configuration in the dev environment
 */

/**
 * Export the configuration
 * @type {Object}
 */
module.exports = {
  network: {
    hostname: 'localhost',
    port: 8080
  },
  store: {},

  blockchains: {
    bitcoind: {},
    geth: {},
    lnd: {}
  },
  orderbooks: {},
  swaps: {}
}
