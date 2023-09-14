/**
 * @file An interface to all swaps
 */

const { BaseClass } = require('@portaldefi/core')

/**
 * Expose the interface to all swaps
 * @type {Swaps}
 */
module.exports = class Swaps extends BaseClass {
  constructor (sdk) {
    super()

    this.sdk = sdk
    // .on('swap.created', (...args) => this.onSwapCreated(...args))
    // .on('swap.opening', (...args) => this.onSwapOpening(...args))
    // .on('swap.opened', (...args) => this.onSwapOpened(...args))
    // .on('swap.committing', (...args) => this.onSwapCommitting(...args))
    // .on('swap.committed', (...args) => this.onSwapCommitted(...args))
    // .on('swap.aborting', (...args) => this.onSwapAborting(...args))
    // .on('swap.aborted', (...args) => this.onSwapAborted(...args))

    Object.seal(this)
  }

  /**
   * Synchronizes the swaps with the store
   * @returns {Promise<Swaps>}
   */
  sync () {
    // TODO: Fix this to load from the store on startup
    // TODO: Fix this to write to the store on shutdown
    return Promise.resolve(this)
  }

  /**
   * Create the required state for an atomic swap
   * @param {Swap|Object} swap The swap to open
   * @param {Object} opts Options for the operation
   * @returns {Swap}
   */
  swapOpen (swap, opts) {
    return this.sdk.helpers.request({
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
    return this.sdk.helpers.request({
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
    return this.sdk.helpers.request({
      method: 'DELETE',
      path: '/api/v1/swap'
    }, { swap, opts })
  }
}
