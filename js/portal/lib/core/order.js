/**
 * @file Defines an order
 */

const uuid = require('uuid')

/**
 * A list of supported assets
 * @type {Map}
 */
const ASSETS = require('./assets')

/**
 * A list of supported networks
 * @type {Array}
 */
const NETWORKS = ['goerli', 'sepolia']

/**
 * The side of the orderbook to put the order into
 * @type {Array}
 */
const ORDER_SIDES = ['ask', 'bid']

/**
 * Types of orders
 * @type {Array}
 */
const ORDER_TYPES = ['limit', 'market']

/**
 * Defines an order
 */
module.exports = class Order {
  /**
   * Creates a new instance of an order
   * @param {Object} props Properties of the order
   */
  constructor (props) {
    if (props.uid == null) {
      throw new Error('no uid specified!')
    } else if (typeof props.uid !== 'string' || props.uid.length <= 0) {
      throw new Error(`uid must be a string; got ${typeof props.uid}`)
    } else if (props.type == null) {
      throw new Error('no type specified!')
    } else if (!ORDER_TYPES.includes(props.type)) {
      throw new Error(`type must one of "${ORDER_TYPES.join(', ')}"`)
    } else if (props.side == null) {
      throw new Error('no side specified!')
    } else if (!ORDER_SIDES.includes(props.side)) {
      throw new Error(`type must one of "${ORDER_SIDES.join(', ')}"`)
    } else if (props.hash == null) {
      throw new Error('no hash specified!')
    }

    if (!ASSETS.has(props.baseAsset)) {
      throw new Error(`"${props.baseAsset}" is not a supported base asset!`)
    } else if (!NETWORKS.includes(props.baseNetwork)) {
      throw new Error(`"${props.baseNetwork}" is not a supported blockchain!`)
    } else if (isNaN(+props.baseQuantity) || (+props.baseQuantity <= 0)) {
      throw new Error(`"${props.baseQuantity}" is not a valid quantity!`)
    }

    if (!ASSETS.has(props.quoteAsset)) {
      throw new Error(`"${props.quoteAsset}" is not a supported quote asset!`)
    } else if (!NETWORKS.includes(props.quoteNetwork)) {
      throw new Error(`"${props.quoteNetwork}" is not a supported blockchain!`)
    } else if (isNaN(+props.quoteQuantity) || (+props.quoteQuantity <= 0)) {
      throw new Error(`"${props.quoteQuantity}" is not a valid quantity!`)
    }

    Object.freeze(Object.assign(this, {
      id: props.id || uuid.v4(),
      ts: props.ts || Date.now(),
      uid: props.uid,
      type: props.type,
      side: props.side,
      hash: props.hash,
      baseAsset: props.baseAsset,
      baseNetwork: props.baseNetwork,
      baseQuantity: props.baseQuantity,
      quoteAsset: props.quoteAsset,
      quoteNetwork: props.quoteNetwork,
      quoteQuantity: props.quoteQuantity
    }))
  }

  /**
   * Returns the age of the order in milliseconds from when it was received
   * @returns {Number}
   */
  get age () {
    return Date.now() - this.ts
  }

  /**
   * Returns the asset pair the order is trading
   */
  get assetPair () {
    return `${this.baseAsset}-${this.quoteAsset}`
  }

  /**
   * Returns if the order is a ask (sell)
   * @returns {Boolean}
   */
  get isAsk () {
    return this.side === 'ask'
  }

  /**
   * Returns if the order is a bid (buy)
   * @returns {Boolean}
   */
  get isBid () {
    return this.side === 'bid'
  }

  /**
   * Returns the unit price of the base asset in terms of the quote asset
   * @returns {Number}
   */
  get price () {
    return this.quoteQuantity / this.baseQuantity
  }

  /**
   * Returns the current state of the instance
   * @type {String}
   */
  [Symbol.for('nodejs.util.inspect.custom')] () {
    return this.toJSON()
  }

  /**
   * Returns the JSON representation of this instance
   * @returns {Object}
   */
  toJSON () {
    return {
      id: this.id,
      ts: this.ts,
      uid: this.uid,
      type: this.type,
      side: this.side,
      hash: this.hash,
      baseAsset: this.baseAsset,
      baseQuantity: this.baseQuantity,
      baseNetwork: this.baseNetwork,
      quoteAsset: this.quoteAsset,
      quoteQuantity: this.quoteQuantity,
      quoteNetwork: this.quoteNetwork
    }
  }
}
