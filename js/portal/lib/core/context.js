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
  store: new Store()
}

/**
 * Interface to all supported blockchain networks
 * @type {Networks}
 */
HttpContext.networks = new Networks({
  ethereum: {
    '@type': 'ethereum',
    assets: ['ETH'],
    contracts: process.env.PORTAL_ETHEREUM_CONTRACTS,
    chainId: process.env.PORTAL_ETHEREUM_CHAINID,
    url: process.env.PORTAL_ETHEREUM_URL
  },
  'lightning.btc': {
    '@type': 'lightning',
    assets: ['BTC']
  }
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
