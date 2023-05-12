/**
 * @file Exposes all in-progress atomic swaps
 */

const { EventEmitter } = require('events')
const Swap = require('./swap')

/**
 * Forwards events to the specified EventEmitter instance
 * @param {EventEmitter} self The EventEmitter instance that will fire the event
 * @param {String} event The event being fired/handled
 * @returns {[Void}
 */
function forwardEvent (self, event) {
  return function (...args) {
    self.emit('log', 'info', `swap.${event}`, ...args)
    self.emit(event, ...args)
  }
}

/**
 * Exposes all in-progress atomic swaps
 * @type {Swaps}
 */
module.exports = class Swaps extends EventEmitter {
  constructor (props, ctx) {
    super()

    this.ctx = ctx
    this.swaps = new Map()

    Object.seal(this)
  }

  /**
   * Creates a new swap for a given maker/taker/client combination
   * @param {Order|Object} maker The maker side of the order
   * @param {Order|Object} taker The taker side of the order
   * @returns {Promise<Swap>}
   */
  fromOrders (maker, taker) {
    return new Promise((resolve, reject) => {
      let swap

      try {
        swap = Swap.fromOrders(maker, taker, this.ctx)
          .once('created', forwardEvent(this, 'created'))
          .once('opening', forwardEvent(this, 'opening'))
          .once('opened', forwardEvent(this, 'opened'))
          .once('committing', forwardEvent(this, 'committing'))
          .once('committed', forwardEvent(this, 'committed'))

        this.swaps.has(swap.id) || this.swaps.set(swap.id, swap)
      } catch (err) {
        return reject(err)
      }

      resolve(swap)
    })
  }

  /**
   * Handles the opening of a swap by a user that is a party to the swap
   * @param {Swap} swap The swap to open
   * @param {String} swap.id The unique identifier of the swap to be opened
   * @param {Party|Object} party The party that is opening the swap
   * @param {String} party.id The unique identifier of the party
   * @param {Object} opts Configuration options for the operation
   * @returns {Promise<Swap>}
   */
  open (swap, party, opts) {
    if (swap == null || swap.id == null) {
      return Promise.reject(Error('unknown swap!'))
    } else if (!this.swaps.has(swap.id)) {
      return Promise.reject(Error(`unknown swap "${swap.id}"!`))
    } else {
      return this.swaps.get(swap.id).open(party, opts)
    }
  }

  /**
   * Handles commiting to a swap by a user that is a party to id
   * @param {Swap} swap The swap being committed
   * @param {String} swap.id The unique identifier of the swap to be committed
   * @param {Party} party The party that is committing the swap
   * @param {String} party.id The unique identifier of the party
   * @param {Object} opts Configuration options for the operation
   * @returns {Promise<Swap>}
   */
  commit (swap, party, opts) {
    if (swap == null || swap.id == null) {
      throw new Error('unknown swap!')
    } else if (!this.swaps.has(swap.id)) {
      throw new Error(`unknown swap "${swap.id}"!`)
    } else {
      return this.swaps.get(swap.id).commit(party, opts)
    }
  }

  /**
   * Aborts a swap gracefully
   * @param {Swap} swap The swap to be aborted
   * @param {String} swap.id The unique identifier of the swap to be aborted
   * @param {Party} party The party that is aborting the swap
   * @param {String} party.id The unique identifier of the party
   * @param {Object} opts Configuration options for the operation
   * @returns {Promise<Void>}
   */
  abort (swap, party, opts) {
    return new Promise((resolve, reject) => {
      reject(Error('not implemented yet!'))
    })
  }
}
