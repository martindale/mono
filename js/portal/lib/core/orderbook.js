/**
 * @file Implements an orderbook for a single asset-pair
 */

const { EventEmitter } = require('events')
const Order = require('./order')

/**
* A weak-map storing private data for each instance of the class
* @type {WeakMap}
*/
const INSTANCES = new WeakMap()

/**
 * Implements an Orderbook
 * @type {Orderbook}
 */
module.exports = class Orderbook extends EventEmitter {
  /**
   * Creates a new instance of an orderbook
   * @param {[Object]} props Properties of the orderbook
   * @param {[String]} props.baseAsset The symbol of the asset being bought/sold
   * @param {[String]} props.quoteAsset The symbol of the asset used for payment
   * @param {[Number]} props.limitSize Reciprocal of the smallest limit price
   */
  constructor (props) {
    if (props == null) {
      throw new Error('instantiated without arguments!')
    } else if (props.baseAsset == null) {
      throw new Error('instantiated without baseAsset!')
    } else if (props.quoteAsset == null) {
      throw new Error('instantiated without quoteAsset!')
    } else if (+props.limitSize <= 0) {
      throw new Error('instantiated with invalid limitSize!')
    }

    super()

    INSTANCES.set(this, Object.seal({
      baseAsset: props.baseAsset,
      quoteAsset: props.quoteAsset,
      limitSize: props.limitSize,
      orders: new Map(),
      bids: {},
      asks: {}
    }))

    Object.seal(this)
  }

  /**
   * Returns the asset-pair being traded in the orderbook
   */
  get assetPair () {
    return `${this.baseAsset}-${this.quoteAsset}`
  }

  /**
   * The symbol of the asset being bought/sold
   * @returns {String}
   */
  get baseAsset () {
    return INSTANCES.get(this).baseAsset
  }

  /**
   * The reciprocal of the smallest limit price in the orderbook
   * @returns {Number}
   */
  get limitSize () {
    return INSTANCES.get(this).limitSize
  }

  /**
   * The number of orders in the orderbook
   * @returns {Number}
   */
  get orderCount () {
    return INSTANCES.get(this).orders.size
  }

  /**
   * The symbol of the asset used for payment
   * @returns {String}
   */
  get quoteAsset () {
    return INSTANCES.get(this).quoteAsset
  }

  /**
   * Returns the current state of the instance
   * @type {String}
   */
  [Symbol.for('nodejs.util.inspect.custom')] () {
    return this.toJSON()
  }

  /**
   * Returns the current state of the instance
   * @returns {Object}
   */
  toJSON () {
    return {
      type: this.constructor.name
    }
  }

  /**
   * Adds an order to the orderbook
   * @param {Object} order The order to be added to the orderbook
   * @param {String} order.uid The unique identifier of the user
   * @param {String} order.type The type of the order (should be limit)
   * @param {String} order.side The side of the orderbook to add the order
   * @param {String} order.hash The hash of the atomic swap secret
   * @param {String} order.assetPair The asset-pair being traded in the order
   * @param {String} order.baseNetwork The parent network for the base asset
   * @param {String} order.baseQuantity The amount of base asset being traded
   * @param {String} order.quoteNetwork The parent network for the quote asset
   * @param {String} order.quoteQuantity The amount of quote asset being traded
   * @returns {Promise<Order>}
   */
  add (order) {
    return new Promise((resolve, reject) => {
      const { orders } = INSTANCES.get(this)

      try {
        order = new Order(order)
      } catch (err) {
        return reject(err)
      }

      // TODO: Add the order to all other data structures
      orders.set(order.id, order)
      resolve(order)
    })
  }

  /**
   * Deletes an order from the orderbook
   * @param {Object} order The order to be deleted
   * @param {String} order.id The unique identifier of the order to be deleted
   * @returns {Promise<Order|null>} The deleted order, if available
   */
  delete (order) {
    return new Promise((resolve, reject) => {
      const { orders } = INSTANCES.get(this)

      if (orders.has(order.id)) {
        order = orders.get(order.id)
        // TODO: Get rid of order from all other data structures
        orders.delete(order.id)
        resolve(order)
      } else {
        reject(new Error(`Order ${order.id} not found!`))
      }
    })
  }
}
