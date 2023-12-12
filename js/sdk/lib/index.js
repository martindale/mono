/**
 * @file The Portal SDK
 */

const { BaseClass } = require('@portaldefi/core')
const Blockchains = require('./blockchains')
const Dex = require('./dex')
const Network = require('./network')
const Store = require('./store')
const Swaps = require('./swaps')

/**
 * Creates and returns an event-handler that forwards the specified event
 * @param {String} event The name of the event
 * @returns {Function}
 */
function forwardEvent (self, event) {
  return function (...args) { self.emit(event, ...args) }
}

/**
 * The Portal SDK
 * @type {Sdk}
 */
module.exports = class Sdk extends BaseClass {
  /**
   * Creates a new instance of the Portal SDK
   * @param {Object} props Properties of the instance
   * @param {String} props.id Unique identifier of the instance
   * @param {Object} props.network Properties of the network
   * @param {Object} props.store Properties of the store
   * @param {Object} props.blockchains Properties of the supported blockchains
   * @param {Object} props.dex Properties of the dex
   * @param {Object} props.swaps Properties of the swaps
   */
  constructor (props) {
    super({ id: props.id })

    /**
     * Interface to the underlying network (browser/node.js)
     * @type {Network}
     */
    this.network = new Network(this, props.network)
      .on('order.created', forwardEvent(this, 'order.created'))
      .on('order.opened', forwardEvent(this, 'order.opened'))
      .on('order.closed', forwardEvent(this, 'order.closed'))

    /**
     * Interface to the underlying data store (browser/node.js)
     * @type {Store}
     */
    this.store = new Store(this, props.store)

    /**
     * Interface to all the blockchain networks
     * @type {Blockchains}
     */
    this.blockchains = new Blockchains(this, props.blockchains)

    /**
     * Interface to the decentralized exchange
     * @type {Dex}
     */
    this.dex = new Dex(this, props.dex)

    /**
     * Interface to atomic swaps
     * @type {Swaps}
     */
    const onSwap = swap => this.emit(`swap.${swap.status}`, swap)
    this.swaps = new Swaps(this, props.swaps)
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

    // Bubble up the log and error events
    const bubbleErrorsAndLogs = emitter => emitter
      .on('error', (err, ...args) => this.emit('error', err, ...args))
      .on('log', (level, ...args) => this[level](...args))
    bubbleErrorsAndLogs(this.network)
    bubbleErrorsAndLogs(this.store)
    bubbleErrorsAndLogs(this.blockchains)
    bubbleErrorsAndLogs(this.dex)
    bubbleErrorsAndLogs(this.swaps)

    Object.freeze(this)
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
    return Object.assign(super.toJSON(), {
      network: this.network,
      store: this.store,
      blockchains: this.blockchains,
      dex: this.dex,
      swaps: this.swaps
    })
  }

  /**
   * Starts the Portal SDK
   * @returns {Sdk}
   */
  start () {
    const operations = [
      this.network.connect(),
      this.store.open(),
      this.blockchains.connect(),
      this.dex.open(),
      this.swaps.sync()
    ]

    return Promise.all(operations)
      .then(([network, store, blockchains, dex, swaps]) => {
        this.info('start', this)
        this.emit('start')
        return this
      })
  }

  /**
   * Gracefully closes the Portal SDK.
   * @returns {Sdk}
   */
  stop () {
    const operations = [
      this.network.disconnect(),
      this.store.close(),
      this.blockchains.disconnect(),
      this.dex.close(),
      this.swaps.sync()
    ]

    return Promise.all(operations)
      .then(([network, store, blockchains, dex, swaps]) => {
        this.info('stop', this)
        this.emit('stop')
        return this
      })
  }
}
