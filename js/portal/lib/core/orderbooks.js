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
  { baseAsset: 'BTC', quoteAsset: 'ETH', limitSize: 100000 },
  { baseAsset: 'ETH', quoteAsset: 'USDC', limitSize: 100 }
]

/**
 * Creates an event handler for the orderbook
 * @param {EventEmitter} self The EventEmitter instance that will fire the event
 * @param {Orderbook} orderbook The orderbook that is firing the event
 * @param {String} event The event being fired by the orderbook
 * @returns {[Void}
 */
function handleOrderbookEvent (self, orderbook, event) {
  return function (...args) {
    self.emit('log', 'info', `order.${event}`, ...args, orderbook)
    self.emit(event, ...args, orderbook)
  }
}

/**
 * Exposes all supported orderbooks under a single class
 * @type {Orderbooks}
 */
module.exports = class Orderbooks extends EventEmitter {
  constructor (props, ctx) {
    super()

    for (const obj of PROPS) {
      const orderbook = new Orderbook(obj)
      this[orderbook.assetPair] = orderbook
        .on('created', handleOrderbookEvent(this, orderbook, 'created'))
        .on('opened', handleOrderbookEvent(this, orderbook, 'opened'))
        .on('closed', handleOrderbookEvent(this, orderbook, 'closed'))
        .on('match', handleOrderbookEvent(this, orderbook, 'match'))
        .on('error', handleOrderbookEvent(this, orderbook, 'error'))
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
