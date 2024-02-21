/**
 * @file Exposes all in-progress atomic swaps
 */

const { BaseClass, Swap } = require('@portaldefi/core')

/**
 * Exposes all in-progress atomic swaps
 * @type {Swaps}
 */
module.exports = class Swaps extends BaseClass {
  constructor (props, ctx) {
    super()

    this.ctx = ctx
    this.swaps = new Map()

    Object.freeze(this)
  }

  /**
   * Creates a new swap for a given maker/taker/client combination
   * @param {Order|Object} maker The maker side of the order
   * @param {Order|Object} taker The taker side of the order
   * @returns {Promise<Swap>}
   */
  fromOrders (maker, taker) {
    return new Promise((resolve, reject) => {
      try {
        const swap = Swap.fromOrders(maker, taker, this.ctx)

        if (this.swaps.has(swap.id)) {
          reject(Error(`swap "${swap.id}" already exists!`))
        } else {
          this.swaps.set(swap.id, swap)
          this.emit(swap.status, swap)
          resolve(swap)
        }
      } catch (err) {
        reject(err)
      }
    })
  }

  /**
   * Handles incoming swap updates
   * @param {Object} swapObj The JSON representation of the swap
   * @param {Object} partyObj The JSON representation of the party that sent the update
   */
  onSwap (swapObj, partyObj) {
    return new Promise((resolve, reject) => {
      if (swapObj == null || swapObj.id == null) {
        return reject(Error('unknown swap!'))
      } else if (!this.swaps.has(swapObj.id)) {
        return reject(Error(`unknown swap "${swapObj.id}"!`))
      }

      const swap = this.swaps.get(swapObj.id)

      if (!swap.isParty(partyObj)) {
        return reject(Error('unauthorized swap update!'))
      }

      try {
        swap.update(swapObj)
      } catch (err) {
        reject(err)
      }

      resolve(swap)
      this.emit(swap.status, swap)
    })
  }
}
