/**
 * @file Defines a party to an atomic swap
 */

/**
 * Defines a party to a swap
 * @type {Party}
 */
module.exports = class Party {
  /**
   * Creates a new instance of a party to a swap
   * @param {Object} props Properties of the instance
   * @param {String} props.id The unique identifier of the party
   * @param {Asset} props.asset The asset which the party wants to trade
   * @param {Network} props.network The network on which the party holds assets
   * @param {Number} props.quantity The quantity of the asset being traded
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
    this.state = {} // populated by the user/client over http/rpc
  }

  /**
   * Returns the counterparty to the swap
   * @returns {Party}
   */
  get counterparty () {
    if (this.isSecretHolder) {
      return this.swap.secretSeeker
    } else if (this.isSecretSeeker) {
      return this.swap.secretHolder
    } else {
      throw Error('cannot use .counterparty in multi-party swap!')
    }
  }

  /**
   * Returns whether or not the party is the secret holder
   * @returns {Boolean}
   */
  get isSecretHolder () {
    return this.swap && this.swap.secretHolder === this
  }

  /**
   * Returns whether or not the party is the secret seeker
   * @returns {Boolean}
   */
  get isSecretSeeker () {
    return this.swap && this.swap.secretSeeker === this
  }

  get swapHash () {
    return this.swap.secretHash
  }

  /**
   * Opens a swap for a single party
   *
   * Opening a swap essentially means creating an invoice on the counterparty's
   * network. It should not matter which party goes first, as there is no money
   * changing hands yet, but for now, we expect the SecretSeeker to move first,
   * followed by the SecretHolder.
   *
   * @param {Object} opts Configuration options for the operation
   * @returns {Promise<Party>}
   */
  open (opts) {
    try {
      if ((this.swap.isCreated && this.isSecretSeeker) ||
          (this.swap.isOpening && this.isSecretHolder)) {
        // Create an invoice on the counterparty's network
        return this.counterparty.network.open(this, opts)
      }

      if ((this.swap.isCreated && this.isSecretHolder)) {
        return Promise.reject(Error('waiting for secret seeker to open!'))
      } else if ((this.swap.isOpening && this.isSecretSeeker)) {
        return Promise.reject(Error('swap already opened!'))
      } else {
        return Promise.reject(Error('undefined behavior!'))
      }
    } catch (err) {
      return Promise.reject(err)
    }
  }

  /**
   * Commits to a swap for a single party
   * @param {Object} opts Configuration options for the operation
   * @returns {Promise<Party>}
   */
  commit (opts) {
    try {
      if (this.isSecretSeeker && this.swap.isOpened) {
        return this.counterparty.network.commit(this, opts)
      } else if (this.isSecretHolder && this.swap.isCommitting) {
        return this.network.commit(this, opts)
      }

      if ((this.swap.isOpened && this.isSecretHolder)) {
        return Promise.reject(Error('waiting for secret seeker to commit!'))
      } else if ((this.swap.isCommitting && this.isSecretHolder)) {
        return Promise.reject(Error('swap already committed!'))
      } else {
        return Promise.reject(Error('undefined behavior!'))
      }
    } catch (err) {
      return Promise.reject(err)
    }
  }

  /**
   * Gracefully aborts a swap for a single party
   * @returns {Promise<Party>}
   */
  abort () {
    return Promise.reject(Error('not implemented yet!'))
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
    const obj = {
      '@type': this.constructor.name,
      id: this.id,
      swap: this.swap && { id: this.swap.id },
      asset: this.asset,
      network: this.network,
      quantity: this.quantity,
      state: this.state,
      isSecretSeeker: this.isSecretSeeker,
      isSecretHolder: this.isSecretHolder
    }

    return obj
  }

  /**
   * Creates a secret-holding party from the an order from the matching engine
   * @param {Order} order An order (maker or taker) returned by order matching
   * @returns {Party}
   */
  static fromOrder (order, ctx) {
    const asset = order.isAsk ? order.baseAsset : order.quoteAsset
    const network = order.isAsk ? order.baseNetwork : order.quoteNetwork
    const quantity = order.isAsk ? order.baseQuantity : order.quoteQuantity
    return new Party({
      id: order.uid,
      asset: ctx.assets[asset],
      network: ctx.networks[network],
      quantity
    })
  }
}
