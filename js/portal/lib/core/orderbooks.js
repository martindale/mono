/**
 * @file Defines all the orderbooks in the system
 */

const Order = require('./order')
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
      const orderbook = new Orderbook(obj)
        .on('error', (...args) => this.emit('error', ...args, orderbook))
        .on('created', (...args) => this.emit('created', ...args, orderbook))
        .on('opened', (...args) => this.emit('opened', ...args, orderbook))
        .on('closed', (...args) => this.emit('closed', ...args, orderbook))
        .on('match', (...args) => this.emit('match', ...args, orderbook))

      this[orderbook.assetPair] = orderbook
    }

    Object.seal(this)
  }

  /**
   * Adds a new order to the orderbook
   * @param {Object} obj The JSON representation of the order
   * @param {String} obj.uid The unique identifier of the user
   * @param {String} obj.type The type of the order (should be limit)
   * @param {String} obj.side The side of the orderbook to add the order
   * @param {String} obj.hash The hash of the atomic swap secret
   * @param {String} obj.baseAsset The symbol of the asset being bought/sold
   * @param {String} obj.baseNetwork The parent network for the base asset
   * @param {String} obj.baseQuantity The amount of base asset being traded
   * @param {String} obj.quoteAsset The symbol of the asset used for payment
   * @param {String} obj.quoteNetwork The parent network for the quote asset
   * @param {String} obj.quoteQuantity The amount of quote asset being traded
   * @returns {Promise<Order>}
   */
  add (obj) {
    let order
    try {
      order = new Order(obj)
    } catch (err) {
      return Promise.reject(err)
    }

    const assetPair = order.assetPair
    const orderbook = this[assetPair]
    if (orderbook != null) {
      return orderbook.add(order)
    } else {
      return Promise.reject(Error(`unknown asset-pair "${assetPair}"`))
    }
  }

  /**
   * Cancels a possibly existing order from the orderbook
   * @param {Object} obj The JSON representation of the order
   * @param {String} obj.id The unique identifier of the order
   * @param {String} obj.baseAsset The symbol of the asset being bought/sold
   * @param {String} obj.quoteAsset The symbol of the asset used for payment
   * @returns {Promise<Order>}
   */
  cancel (obj) {
    const assetPair = Order.toAssetPair(obj)
    const orderbook = this[assetPair]
    if (orderbook != null) {
      return orderbook.cancel(obj)
    } else {
      return Promise.reject(Error(`unknown asset-pair "${assetPair}"`))
    }
  }
}
