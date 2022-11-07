/**
 * @file Defines the state of a single party to an atomic swap
 */

const uuid = require('uuid')

/**
 * Defines the state of a single party to an atomic swap
 * @type {Party}
 */
module.exports = class Party {
  /**
   * Creates a new Party instance
   * @param {Object} props Properties of the swap
   * @param {String} props.id Unique identifier of the owner of the swap half
   * @param {String} props.makerOrder The maker order that triggered the swap
   * @param {String} props.takerOrder The taker order that triggered the swap
   */
  constructor (props) {
    this.id = uuid.v4()
    this.uid = props.uid
    this.makerOrder = props.makerOrder
    this.takerOrder = props.takerOrder

    Object.seal(this)
  }

 /**
  * Returns the unique identifier for this particular swap part/side
  * @returns {String}
  */
  get id () {
    return hash(this.swapId + this.userId)
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
