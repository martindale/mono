/**
 * @file Defines all the orderbooks in the system
 */

const Swap = require('./swap')
const { EventEmitter } = require('events')

/**
 * Exposes all in-progress atomic swaps
 * @type {Swaps}
 */
module.exports = class Swaps extends EventEmitter {
  constructor (props, ctx) {
    super()
    this.swaps = new Map()
    Object.seal(this)
  }

  /**
   * Creates a new swap for a given maker/taker/client combination
   * @param {Order} maker The maker side of the order
   * @param {Order} taker The taker side of the order
   * @returns {Swap} [description]
   */
  create (maker, taker) {
    return new Promise((resolve, reject) => {
      let swap

      try {
        swap = new Swap(maker, taker)
        this.swaps.has(swap.id) || this.swaps.set(swap.id, swap)
      } catch (err) {
        return reject(err)
      }

      resolve(swap)
    })
  }
}
