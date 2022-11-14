/**
 * @file The Lightning network
 */

const Network = require('../core/network')
const Raiden = require('lightning')

/**
 * Exports a Web3 interface to the Lightning blockchain network
 * @type {Raiden}
 */
module.exports = class Raiden extends Network {
  constructor (props) {
    super({
      assets: ['ETH', 'USDC'],
      client: new Raiden()
    })
  }

  open () {
    throw new Error('yet to be implemented!')
  }

  commit () {
    throw new Error('yet to be implemented!')
  }
}
