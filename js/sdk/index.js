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
     * The Portal SDK instance
     * @type {Sdk}
     */
    const onSwap = swap => this.emit(`swap.${swap.status}`, swap)
    this.sdk = new Sdk(props)
      // DEX events
      .on('order.created', (...args) => this.emit('order.created', ...args))
      .on('order.opened', (...args) => this.emit('order.opened', ...args))
      .on('order.closed', (...args) => this.emit('order.closed', ...args))
      // Swap events
      .on('swap.received', onSwap)
      .on('swap.created', onSwap)
      .on('swap.holder.invoice.created', onSwap)
      .on('swap.holder.invoice.sent', onSwap)
      .on('swap.seeker.invoice.created', onSwap)
      .on('swap.seeker.invoice.sent', onSwap)
      .on('swap.holder.invoice.paid', onSwap)
      .on('swap.seeker.invoice.paid', onSwap)
      .on('swap.holder.invoice.settled', onSwap)
      .on('swap.seeker.invoice.settled', onSwap)
      .on('swap.completed', onSwap)
      // All other events
      .on('message', (...args) => this.emit('message', ...args))
      .on('log', (...args) => this.emit('log', ...args))
      .on('error', (...args) => this.emit('error', ...args))
  }

  get id () {
    return this.sdk.id
  }

  get isConnected () {
    return this.sdk.network.isConnected
  }

  /**
   * Returns the JSON representation of the instance
   * @returns {Object}
   */
  toJSON () {
    return Object.assign(super.toJSON(), { sdk: this.sdk })
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
   * Submits a limit order to the DEX
   * @param {Object} order The limit order to add to the DEX
   */
  submitLimitOrder (order) {
    return this.sdk.dex.submitLimitOrder(order)
  }

  /**
   * Cancels a previously submitted limit order
   * @param {Object} order The limit order to delete the DEX
   */
  cancelLimitOrder (order) {
    return this.sdk.dex.cancelLimitOrder(order)
  }

  request (...args) {
    return this.sdk.network.request(...args)
  }

  send (...args) {
    return this.sdk.network.send(...args)
  }
}
