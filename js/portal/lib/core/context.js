/**
 * @file Request Context
 */

const Store = require('./store')
const Web3Legacy = require('web3-legacy')

/**
 * Export an object that exposes the injected dependencies
 * @type {Object}
 */
module.exports = {
  goerli: new Web3Legacy(process.env.PORTAL_GOERLI_RPC_URL),
  log: console,
  ropsten: new Web3Legacy(process.env.PORTAL_ROPSTEN_RPC_URL),
  store: new Store({ path: process.env.PORTAL_STORE_PATH })
}
