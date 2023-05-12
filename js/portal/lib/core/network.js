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
   * @param {String} props.name The unique name of the network
   * @param {String[]} props.assets Assets supported by the blockchain network
   */
  constructor (props) {
    super()

    if (this.constructor === Network) {
      throw Error('cannot instantiate an abstract class!')
    } else if (props.name == null || typeof props.name !== 'string') {
      throw Error('network must have a valid name!')
    } else if (!Array.isArray(props.assets) || props.assets.length <= 0) {
      throw Error('must specify a set of assets supported by the network!')
    }

    this.name = props.name || this.constructor.name.toLowerCase()
    this.assets = new Set(props.assets)
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
      '@type': this.constructor.name,
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

  open (party, opts) {
    throw new Error('not implemented!')
  }

  commit (party, opts) {
    throw new Error('not implemented!')
  }

  abort (party, opts) {
    throw new Error('not implemented!')
  }
}
