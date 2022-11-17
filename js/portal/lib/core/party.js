/**
 * @file Defines an instance of an Atomic Swap
 */

/**
 * Defines a party to a swap
 */
module.exports = class Party {
  /**
   * Creates a new instance of a party to a swap
   * @param {Object} props Properties of the instance
   * @param {String} props.id The unique identifier of the party
   * @param {Network} props.network The network on which the party holds assets
   */
  constructor (props) {
    if (props == null) {
      throw Error('no properties specified for the party!')
    } else if (props.id == null) {
      throw Error('unique identifier of the user was not specified!')
    }

    this.id = props.id
    this.asset = props.asset
    this.network = props.network
    this.quantity = props.quantity
    this.swap = null // assigned by the swap constructor
    this.state = null // populated by the user/client over http/rpc

    Object.seal(this)
  }

  /**
   * Returns whether or not the party is the secret holder
   * @returns {Boolean}
   */
  get isSecretHolder () {
    return this.swap.secretHolder === this
  }

  /**
   * Returns whether or not the party is the secret seeker
   * @returns {Boolean}
   */
  get isSecretSeeker () {
    return this.swap.secretSeeker === this
  }

  /**
   * Overridable step one function of the two-step swap
   * @returns {Promise<Party>}
   */
  open () {
    return Promise.resolve(this)
  }

  /**
   * Overridable step two function of the two-step swap
   * @returns {Promise<Party>}
   */
  commit () {
    return Promise.resolve(this)
  }

  /**
   * Overridable step two function of the two-step swap
   * @returns {Promise<Party>}
   */
  abort () {
    return Promise.resolve(this)
  }

  /**
   * Creates a secret-holding party from the an order from the matching engine
   * @param {Order} order An order (maker or taker) returned by order matching
   * @returns {Party}
   */
  static fromOrder (order, ctx) {
    return new Party({
      id: order.uid,
      asset: ctx.assets[order.asset],
      network: ctx.networks[order.network],
      quantity: order.quantity
    })
  }
}
