/**
 * @file The Lightning network
 */

const Network = require('../core/network')
const ln = require('lightning')

/**
 * Exports an interface to the Lightning blockchain network
 * @type {Lightning}
 */
module.exports = class Lightning extends Network {
  constructor (props) {
    super({
      assets: ['BTC', 'BCH'],
      client: ln
    })
  }

  init (party) {
    const alice1 = this.client.authenticatedLndGrpc(party.state.clientInfo1)
    const aliceInvoice1 = this.client.authenticatedLndGrpc(party.state.clientInfo1)
  }

  open (party) {
    this.init(party)
    throw new Error('yet to be implemented!')
  }

  commit (party) {
    throw new Error('yet to be implemented!')
  }
}
