/**
 * @file Defines all the orderbooks in the system
 */

const Orderbook = require('./orderbook')
const { EventEmitter } = require('events')

/**
 * A list of asset pairs that can be traded
 * @type {Array<Object>}
 */
const PROPS = [
  { baseAsset: 'ETH', quoteAsset: 'USDC', limitPrice: 100 }
]

/**
 * Exposes all supported orderbooks under a single class
 * @type {Orderbooks}
 */
module.exports = class Orderbooks extends EventEmitter {
  constructor (props, ctx) {
    super()

    for (const obj of PROPS) {
      const assetPair = `${obj.baseAsset}-${obj.quoteAsset}`
      this[assetPair] = new Orderbook(obj)
        .on('add', (...args) => this.emit('add', assetPair, ...args))
        .on('delete', (...args) => this.emit('delete', assetPair, ...args))
    }

    Object.seal(this)
  }

  /**
   * Returns the orderbook for the specified asset-pair
   * @param {Object} obj Specifies the base and quote assets
   * @param {String} obj.baseAsset The base asset of the orderbook
   * @param {String} obj.quoteAsset The quote asset of the orderbook
   * @returns {Orderbook}
   */
  get (obj) {
    const assetPair = `${obj.baseAsset}-${obj.quoteAsset}`
    if (this[assetPair] == null) {
      throw new Error(`unknown asset-pair ${assetPair}`)
    }
    return this[assetPair]
  }
}
