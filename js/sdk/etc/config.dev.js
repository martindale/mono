/**
 * @file SDK Configuration in the dev environment
 */

const { readFileSync } = require('fs')

/**
 * Export the configuration
 * @type {Object}
 */
module.exports = {
  network: {
    hostname: '127.0.0.1',
    port: 18080
  },
  store: {},

  blockchains: {
    ethereum: {
      url: process.env.PORTAL_ETHEREUM_URL,
      chainId: process.env.PORTAL_ETHEREUM_CHAINID,
      contracts: JSON.parse(readFileSync(process.env.PORTAL_ETHEREUM_CONTRACTS))
    },
    lightning: {}
  },
  dex: {},
  swaps: {}
}
