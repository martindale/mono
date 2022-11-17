/**
 * @file Exposes all in-progress atomic swaps
 */

const { EventEmitter } = require('events')
const Swap = require('./swap')

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
          .once('open', () => this.emit('open', swap))
          .once('abort', () => this.emit('abort', swap))
          .once('commit', () => this.emit('commit', swap))

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
   * @param {Party} party The party that is opening the swap
   * @param {String} party.id The unique identifier of the party
   * @param {*} party.state Private data that may be shared with the other party
   * @returns {Promise<Party>}
   */
  open (swap, party) {
    if (swap == null || swap.id == null) {
      return Promise.reject(Error('unknown swap!'))
    } else if (!this.swaps.has(swap.id)) {
      return Promise.reject(Error(`unknown swap "${swap.id}"!`))
    } else {
      return this.swaps.get(swap.id).open(party)
    }
  }

  async open (swap, party) {
    if (swap == null || swap.id == null) {
      throw Error('unknown swap!')
    } else if (!this.swaps.has(swap.id)) {
      throw Error(`unknown swap "${swap.id}"!`)
    } else {
      const swap = this.swaps.get(swap.id)
      const result = await swap.open(party)
      return result
    }
  }

  /**
   * Handles commiting to a swap by a user that is a party to id
   * @param {Swap} swap The swap being committed
   * @param {String} swap.id The unique identifier of the swap to be opened
   * @param {Party} party The party that is opening the swap
   * @param {String} party.id The unique identifier of the party
   * @returns {Promise<Void>}
   */
  commit (swap, party) {
    if (swap == null || swap.id == null) {
      return Promise.reject(Error('unknown swap!'))
    } else if (!this.swaps.has(swap.id)) {
      return Promise.reject(Error(`unknown swap "${swap.id}"!`))
    } else {
      return this.swaps.get(swap.id).commit(party)
    }
  }

  /**
   * Aborts a swap gracefully
   * @param {Swap} swap The swap to be aborted
   * @returns {Promise<Void>}
   */
  abort (swap, party) {
    return new Promise((resolve, reject) => {
      reject(Error('not implemented yet!'))
    })
  }
}
