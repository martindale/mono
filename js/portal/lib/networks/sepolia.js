/**
 * @file The Sepolia blockchain network
 */

const Network = require('../core/network')
const Web3 = require('web3')

/**
 * Exports a Web3 interface to the Sepolia blockchain network
 * @type {Sepolia}
 */
module.exports = class Sepolia extends Network {
  constructor (props) {
    super({
      assets: ['ETH', 'USDC'],
      client: new Web3(props)
    })
  }

  deposit () {
    throw new Error('yet to be implemented!')
  }

  withdraw () {
    throw new Error('yet to be implemented!')
  }
}
