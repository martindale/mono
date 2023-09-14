/**
 * @file Defines an order
 */

const { Util: { uuid } } = require('@portaldefi/core')

/**
 * A list of supported assets
 * @type {Map}
 */
const ASSETS = require('./assets')

/**
 * A list of supported networks
 * @type {Array}
 */
const NETWORKS = [
  'ethereum',
  'lightning.btc'
]

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
 * An enum of order states
 * @type {Array}
 */
const ORDER_STATUS = ['created', 'opened', 'closed']

/**
 * Defines an order
 */
module.exports = class Order {
  /**
   * Creates a new instance of an order
   * @param {Object} props Properties of the order
   * @param {String} props.uid The unique identifier of the user
   * @param {String} props.type The type of the order (should be limit)
   * @param {String} props.side The side of the orderbook to add the order
   * @param {String} props.hash The hash of the atomic swap secret
   * @param {String} props.baseAsset The symbol of the asset being bought/sold
   * @param {String} props.baseQuantity The amount of base asset being traded
   * @param {String} props.baseNetwork The network of base asset being traded
   * @param {String} props.quoteAsset The symbol of the asset used for payment
   * @param {String} props.quoteQuantity The amount of quote asset being traded
   * @param {String} props.quoteNetwork The network of quote asset being traded
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

    if (ASSETS[props.baseAsset] == null) {
      throw new Error(`"${props.baseAsset}" is not a supported base asset!`)
    } else if (!NETWORKS.includes(props.baseNetwork)) {
      throw new Error(`"${props.baseNetwork}" is not a supported blockchain!`)
    } else if (isNaN(+props.baseQuantity) || (+props.baseQuantity <= 0)) {
      throw new Error(`"${props.baseQuantity}" is not a valid quantity!`)
    }

    if (ASSETS[props.quoteAsset] == null) {
      throw new Error(`"${props.quoteAsset}" is not a supported quote asset!`)
    } else if (!NETWORKS.includes(props.quoteNetwork)) {
      throw new Error(`"${props.quoteNetwork}" is not a supported blockchain!`)
    } else if (isNaN(+props.quoteQuantity) || (+props.quoteQuantity <= 0)) {
      throw new Error(`"${props.quoteQuantity}" is not a valid quantity!`)
    }

    Object.seal(Object.assign(this, {
      id: props.id || uuid(),
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
      quoteQuantity: props.quoteQuantity,
      assetPair: Order.toAssetPair(props),
      status: ORDER_STATUS[0],
      reason: null
    }))
  }

  /**
   * Returns an asset-pair, given a JSON object with the base/quote assets
   * @param {Object} obj JSON object representing the order
   * @param {String} obj.baseAsset The symbol of the asset being bought/sold
   * @param {String} obj.quoteAsset The symbol of the asset used for payment
   */
  static toAssetPair (obj) {
    if (obj.baseAsset == null && typeof obj.baseAsset !== 'string') {
      return null
    } else if (obj.quoteAsset == null && typeof obj.quoteAsset !== 'string') {
      return null
    } else {
      return `${obj.baseAsset}-${obj.quoteAsset}`
    }
  }

  /**
   * Returns the age of the order in milliseconds from when it was created
   * @returns {Number}
   */
  get age () {
    return Date.now() - this.ts
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
   * Returns whether or not the order is in the 'created' state
   * @returns {Boolean}
   */
  get isCreated () {
    return this.status === ORDER_STATUS[0]
  }

  /**
   * Returns whether or not the order is in the 'opened' state
   * @returns {Boolean}
   */
  get isOpened () {
    return this.status === ORDER_STATUS[1]
  }

  /**
   * Returns whether or not the order is in the 'closed' state
   * @returns {Boolean}
   */
  get isClosed () {
    return this.status === ORDER_STATUS[2]
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
    const obj = {
      '@type': this.constructor.name,
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
      quoteNetwork: this.quoteNetwork,
      status: this.status,
      reason: this.reason
    }

    return obj
  }

  /**
   * Opens the order on an orderbook
   * @returns {Order}
   */
  open (reason) {
    this.status = ORDER_STATUS[1]
    this.reason = reason || null
    return this
  }

  /**
   * Closes the order on an orderbook
   * @returns {Order}
   */
  close (reason) {
    this.status = ORDER_STATUS[2]
    this.reason = reason || null
    return this
  }

  /**
   * Determines if two orders are equal
   * @param {Order} target The target order instance to check against this one
   * @returns {Boolean}
   */
  equals (target) {
    return this.id === target.id &&
      this.ts === target.ts &&
      this.uid === target.uid &&
      this.type === target.type &&
      this.side === target.side &&
      this.hash === target.hash &&
      this.baseAsset === target.baseAsset &&
      this.baseQuantity === target.baseQuantity &&
      this.baseNetwork === target.baseNetwork &&
      this.quoteAsset === target.quoteAsset &&
      this.quoteQuantity === target.quoteQuantity &&
      this.quoteNetwork === target.quoteNetwork
  }

  /**
   * Validates a matched order-pair
   * @param {Object<Order>} maker The maker order of the match order-pair
   * @param {Object<Order>} taker The taker order of the match order-pair
   * @returns {Boolean}
   */
  static validateMatch (maker, taker) {
    return true
  }
}
