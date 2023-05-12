/**
 * @file An interface to all supported blockchain networks
 */

const { EventEmitter } = require('events')
const { readdirSync, statSync } = require('fs')
const { basename, extname, join } = require('path')

/**
 * Path to the directory containing all the supported blockchain networks
 * @type {String}
 */
const PATH_NETWORKS = join(__dirname, '..', 'networks')

/**
 * A map of supported blockchain networks
 * @type {Map}
 */
const SUPPORTED = readdirSync(PATH_NETWORKS)
  .map(f => join(PATH_NETWORKS, f))
  .filter(f => statSync(f).isFile())
  .filter(f => extname(f) === '.js')
  .reduce((map, f) => map.set(basename(f, extname(f)), require(f)), new Map())

/**
 * Exposes all supported networks under a single class
 * @type {Networks}
 */
module.exports = class Networks extends EventEmitter {
  /**
   * Creates a new instance of an interface to all supported blockchain networks
   * @param {Object} props Properties of each supported blockchain network
   * @param {HttpContext} ctx The HTTP context
   */
  constructor (props, ctx) {
    if (props == null) {
      throw new Error('instantiated without arguments!')
    } else if (Object.keys(props).length === 0) {
      throw new Error('instantiated without any networks!')
    }

    super()

    this.byAssets = new Map()

    for (const name in props) {
      const type = props[name]['@type']

      if (!this.isSupported(type)) {
        throw new Error(`unsupported network "${type}"!`)
      }

      const Network = SUPPORTED.get(type)
      const networkProps = Object.assign(props[name], { name })
      const network = new Network(networkProps)

      for (const asset of network.assets) {
        this.byAssets.has(asset) || this.byAssets.set(asset, new Map())
        this.byAssets.get(asset).set(name, network)
      }

      this[name] = network
    }

    Object.freeze(this)
  }

  /**
   * Returns the list of supported blockchain networks
   */
  get SUPPORTED () {
    return Array.from(SUPPORTED.keys())
  }

  /**
   * Returns whether or not the specified network is supported
   * @param {String} name The name of the network
   * @returns {Boolean}
   */
  isSupported (name) {
    return SUPPORTED.has(name)
  }
}
