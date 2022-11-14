/**
 * @file Request Context
 */

const Assets = require('./assets')
const Networks = require('./networks')
const Orderbooks = require('./orderbooks')
const Store = require('./store')
const Swaps = require('./swaps')

/**
 * Export the request context
 * @type {HttpContext}
 */
const HttpContext = module.exports = {
  log: console,
  store: new Store({ path: process.env.PORTAL_STORE_PATH })
}

/**
 * Interface to all supported blockchain networks
 * @type {Networks}
 */
HttpContext.networks = new Networks({
  goerli: process.env.PORTAL_GOERLI_RPC_URL,
  sepolia: process.env.PORTAL_SEPOLIA_RPC_URL
}, HttpContext)

/**
 * Interface to all supported assets
 * @type {Map}
 */
HttpContext.assets = Assets

/**
 * Interface to all supported orderbooks
 * @type {Orderbooks}
 */
HttpContext.orderbooks = new Orderbooks(null, HttpContext)

/**
 * Interface to all open atomic swaps in progress
 * @type {Swaps}
 */
HttpContext.swaps = new Swaps(null, HttpContext)
