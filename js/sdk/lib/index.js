/**
 * @file The Portal SDK
 */

const { BaseClass } = require('@portaldefi/core')
const Blockchains = require('./blockchains')
const Orderbooks = require('./orderbooks')
const Network = require('./network')
const Store = require('./store')
const Swaps = require('./swaps')

/**
 * The Portal SDK
 * @type {Sdk}
 */
module.exports = class Sdk extends BaseClass {
  /**
   * Creates a new instance of the Portal SDK
   * @param {Object} props Properties of the instance
   */
  constructor (props) {
    super()

    /**
     * Interface to the underlying network (browser/node.js)
     * @type {Network}
     */
    this.network = new Network(props.network)
      // TODO: Refactor these to be less coupled with the Sdk class
      .on('order.created', (...args) => this.emit('order.created', ...args))
      .on('order.opened', (...args) => this.emit('order.opened', ...args))
      .on('order.closed', (...args) => this.emit('order.closed', ...args))
      .on('swap.created', (...args) => this.emit('swap.created', ...args))
      .on('swap.opening', (...args) => this.emit('swap.opening', ...args))
      .on('swap.opened', (...args) => this.emit('swap.opened', ...args))
      .on('swap.committing', (...args) => this.emit('swap.committing', ...args))
      .on('swap.committed', (...args) => this.emit('swap.committed', ...args))
      .on('message', (...args) => this.emit('message', ...args))

    /**
     * Interface to the underlying data store (browser/node.js)
     * @type {Store}
     */
    this.store = new Store(props.store)

    /**
     * Interface to all the blockchain networks
     * @type {Blockchains}
     */
    this.blockchains = new Blockchains(this, props.blockchains)

    /**
     * Interface to the DEX orderbooks
     * @type {Orderbooks}
     */
    this.orderbooks = new Orderbooks(this, props.orderbooks)

    /**
     * Interface to atomic swaps
     * @type {Swaps}
     */
    this.swaps = new Swaps(this, props.swaps)

    Object.freeze(this)
  }

  get id () {
    return this.network.id
  }

  /**
   * Returns whether the SDK is connected to the network
   * @returns {Boolean}
   */
  get isConnected () {
    return this.network.isConnected
  }

  /**
   * Returns the JSON representation of the instance
   * @returns {Object}
   */
  toJSON () {
    const { network, store, blockchains, orderbooks, swaps } = this
    return { network, store, blockchains, orderbooks, swaps }
  }

  /**
   * Starts the Portal SDK.
   *
   * The peer connects to the network intermittently and syncs up state. This
   * method initializes the network sub-system to allow the peer to communicate
   * with the rest of the network.
   *
   * @returns {Sdk}
   */
  start () {
    const operations = [
      this.network.connect(),
      this.store.open(),
      this.blockchains.connect(),
      this.orderbooks.open(),
      this.swaps.sync()
    ]

    return Promise.all(operations)
      .then(([network, store, blockchains, orderbooks, swaps]) => {
        this.emit('start')
        return this
      })
  }

  /**
   * Gracefully terminates the network connection.
   * @returns {Sdk}
   */
  stop () {
    const operations = [
      this.network.disconnect(),
      this.store.close(),
      this.blockchains.disconnect(),
      this.orderbooks.close(),
      this.swaps.sync()
    ]

    return Promise.all(operations)
      .then(([network, store, blockchains, orderbooks, swaps]) => {
        this.emit('stop')
        return this
      })
  }

  /**
   * Adds a limit order to the orderbook
   * @param {Object} order The limit order to add the orderbook
   */
  submitLimitOrder (order) {
    return this.network.request({
      method: 'PUT',
      path: '/api/v1/orderbook/limit'
    }, {
      side: order.side,
      hash: order.hash,
      baseAsset: order.baseAsset,
      baseNetwork: order.baseNetwork,
      baseQuantity: order.baseQuantity,
      quoteAsset: order.quoteAsset,
      quoteNetwork: order.quoteNetwork,
      quoteQuantity: order.quoteQuantity
    })
  }

  /**
   * Adds a limit order to the orderbook
   * @param {Object} order The limit order to delete the orderbook
   */
  cancelLimitOrder (order) {
    return this.network.request({
      method: 'DELETE',
      path: '/api/v1/orderbook/limit'
    }, {
      id: order.id,
      baseAsset: order.baseAsset,
      quoteAsset: order.quoteAsset
    })
  }

  /**
   * Create the required state for an atomic swap
   * @param {Swap|Object} swap The swap to open
   * @param {Object} opts Options for the operation
   * @returns {Swap}
   */
  swapOpen (swap, opts) {
    return this.network.request({
      method: 'PUT',
      path: '/api/v1/swap'
    }, { swap, opts })
  }

  /**
   * Completes the atomic swap
   * @param {Swap|Object} swap The swap to commit
   * @param {Object} opts Options for the operation
   * @returns {Promise<Void>}
   */
  swapCommit (swap, opts) {
    return this.network.request({
      method: 'POST',
      path: '/api/v1/swap'
    }, { swap, opts })
  }

  /**
   * Abort the atomic swap optimistically and returns funds to owners
   * @param {Swap|Object} swap The swap to abort
   * @param {Object} opts Options for the operation
   * @returns {Promise<Void>}
   */
  swapAbort (swap, opts) {
    return this.network.request({
      method: 'DELETE',
      path: '/api/v1/swap'
    }, { swap, opts })
  }
}
