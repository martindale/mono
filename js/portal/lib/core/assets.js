/**
 * @file A list of supported assets
 */

const Asset = require('./asset')

/**
 * A list of supported asssets
 * @todo Generate this from the supported networks
 * @type {Array}
 */
const ASSETS = [
  new Asset({ name: 'Ether', symbol: 'ETH' }),
  new Asset({ name: 'USD (Circle)', symbol: 'USDC' })
].sort((a, b) => a[0] - b[0])

/**
 * Export all supported assets
 * @type {Map}
 */
module.exports = new Map(ASSETS.map(asset => [asset.symbol, asset]))
