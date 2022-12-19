/**
 * @file Implements an interface to a blockchain network
 */

const { EventEmitter } = require('events')

/**
 * A base class for all supported blockchain networks
 * @type {Network}
 */
module.exports = class Network extends EventEmitter {
  /**
   * Creates a new instance of a Network
   * @param {Object} props Properties of the instance
   * @param {Object} props.client The blockchain network client
   * @param {String[]} props.assets Assets supported by the blockchain network
   */
  constructor (props) {
    super()

    if (this.constructor === Network) {
      throw new Error('cannot instantiate an abstract class!')
    }

    this.name = this.constructor.name.toLowerCase()
    this.client = props.client
    this.assets = new Set(props.assets)

    Object.seal(this)
  }

  /**
   * Returns the current state of the instance
   * @type {String}
   */
  [Symbol.for('nodejs.util.inspect.custom')] () {
    return this.toJSON()
  }

  /**
   * Returns the JSON representation of this instance
   * @returns {Object}
   */
  toJSON () {
    return {
      name: this.name
    }
  }

  /**
   * Returns whether or not the network supports the specified asset
   * @param {String} asset The symbol of the asset
   * @returns {Boolean}
   */
  supports (asset) {
    return this.assets.has(asset)
  }

  /**
   * Virtual method to be overridden
   * @returns {Object}
   */
  deposit () {
    throw new Error('not implemented!')
  }

  /**
   * Virtual method to be overridden
   * @returns {Object}
   */
  withdraw () {
    throw new Error('not implemented!')
  }

  open(party) {
    throw new Error('not implemented!')
  }


  commit(party) {
    throw new Error('not implemented!')
  }
}
