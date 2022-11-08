/**
 * @file Defines the state of a single party to an atomic swap
 */

const assert = require('assert')
const uuid = require('uuid')

/**
 * @type {Swap}
 */
module.exports = class Swap {
  /**
   * Creates a new Swap instance
   * @param {Object} props Properties of the swap
   * @param {String} props.maker The maker order that triggered the swap
   * @param {String} props.taker The taker order that triggered the swap
   */
  constructor (props) {
    this.id = hash(maker.id, taker.id)
    this.makerOrder = props.maker
    this.takerOrder = props.taker

    this.makerAsset = this.makerOrder.makerAsset
    this.takerAsset = this.takerOrder.takerAsset

    this.makerNetwork = this.makerAsset.networks[props.makerNetwork] // lightning
    this.takerNetwork = this.takerAsset.networks[props.takerNetwork]

    this.makerClient = props.makerNetwork
    this.takerClient = props.takerNetwork

    this.uid = props.uid

    Object.seal(this)
  }

  /**
   * The parent orderbook which matched the orders that triggered this swap
   * @returns {Orderbook}
   */
  get orderbook () {
    assert(this.makerOrder.orderbook === this.takerOrder.orderbook)
    return this.makerOrder.orderbook
  }

  /**
   * The hash of the secret used to hold assets
   * @returns {String}
   */
  get hash () {
    assert(this.makerOrder.hash === this.takerOrder.hash)
    return this.makerOrder.hash
  }

  /**
   * Returns the globally-unique identifier for the swap; shared by all sides
   * @returns {String}
   */
  get swapId () {
    return hash(maker, taker)
  }

  /**
   * The unique identifier of the owner/user of the swap side
   * @returns {String}
   */
  get userId () {
    return this._uid
  }

  /**
   * Returns the hash of the secret used by the underlying atomic swap
   * @returns {String}
   */
  get hash () {
    if (this.makerOrder.hash !== this.takerOrder.hash) {
      throw Error('maker/taker hash mismatch!')
    }

    return this.makerOrder.hash
  }

  /**
   * Returns whether or not this swap handles the maker-side of the order
   * @returns {Boolean}
   */
  get isMaker () {
    return this.makerOrder.uid === this.uid
  }

  /**
   * Returns whether or not this swap handles the taker-side of the order
   * @returns {Boolean}
   */
  get isTaker () {
    return this.takerOrder.uid === this.uid
  }
}
