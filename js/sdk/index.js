/**
 * @file The Portal SDK
 */

const { BaseClass } = require('@portaldefi/core')
const Sdk = require('./lib')

/**
 * Export the class
 * @type {SDK}
 */
module.exports = class SDK extends BaseClass {
  constructor (props) {
    super()

    /**
     * Client credentials for the blockchains
     * @type {Object}
     * @todo Refactor these out of the client altogether!
     */
    this.credentials = props.credentials

    /**
     * The Portal SDK instance
     * @type {Sdk}
     */
    this.sdk = new Sdk(props)
      .on('order.created', (...args) => this.emit('order.created', ...args))
      .on('order.opened', (...args) => this.emit('order.opened', ...args))
      .on('order.closed', (...args) => this.emit('order.closed', ...args))
      .on('swap.created', (...args) => this.emit('swap.created', ...args))
      .on('swap.opening', (...args) => this.emit('swap.opening', ...args))
      .on('swap.opened', (...args) => this.emit('swap.opened', ...args))
      .on('swap.committing', (...args) => this.emit('swap.committing', ...args))
      .on('swap.committed', (...args) => this.emit('swap.committed', ...args))
      .on('message', (...args) => this.emit('message', ...args))
  }

  get id () {
    return this.sdk.network.id
  }

  get isConnected () {
    return this.sdk.network.isConnected
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
   * @returns {Sdk}
   */
  start () {
    return this.sdk.start()
  }

  /**
   * Gracefully terminates the network connection.
   * @returns {Sdk}
   */
  stop () {
    return this.sdk.stop()
  }

  /**
   * Adds a limit order to the orderbook
   * @param {Object} order The limit order to add the orderbook
   */
  submitLimitOrder (order) {
    return this.sdk.network.request({
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
    return this.sdk.network.request({
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
    return this.sdk.network.request({
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
    return this.sdk.network.request({
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
    return this.sdk.network.request({
      method: 'DELETE',
      path: '/api/v1/swap'
    }, { swap, opts })
  }

  request (...args) {
    return this.sdk.network.request(...args)
  }

  send (...args) {
    return this.sdk.network.send(...args)
  }
}
