/**
 * @file Defines an instance of an Atomic Swap
 */

const Party = require('./party')
const { hash, uuid } = require('../helpers')
const { EventEmitter } = require('events')

/**
 * An enum of swap states
 * @type {Array}
 */
const SWAP_STATUS = [
  'created',
  'opening',
  'opened',
  'committing',
  'committed'
]

/**
 * Stores the state of each swap, keyed by the unique identifier of the swap
 * @type {WeakMap}
 */
const SWAP_INSTANCES = new WeakMap()

/**
 * An instance of an Atomic Swap
 * @type {Swap}
 */
module.exports = class Swap extends EventEmitter {
  /**
   * Creates a new Swap instance
   * @param {Object} props Properties of the atomic swap
   * @param {String} props.id The unique identifier of the atomic swap
   * @param {String} props.secretHash The hash of the secret of the atomic swap
   * @param {Party} props.secretHolder The party that holds the secret
   * @param {Party} props.secretSeeker The party that seeks the secret
   */
  constructor (props) {
    if (!(props.secretHolder instanceof Party)) {
      throw Error('secretHolder is not an instance of Party!')
    } else if (!(props.secretSeeker instanceof Party)) {
      throw Error('secretSeeker is not an instance of Party!')
    } else if (props.secretHolder.id === props.secretSeeker.id) {
      throw Error('cannot self-swap between secretHolder and secretSeeker!')
    }

    super()

    SWAP_INSTANCES.set(this, {
      id: props.id || uuid(),
      secretHash: props.secretHash,
      secretHolder: props.secretHolder,
      secretSeeker: props.secretSeeker,
      status: SWAP_STATUS[0]
    })

    this.secretHolder.swap = this
    this.secretSeeker.swap = this

    Object.seal(this)
  }

  /**
   * Returns the unique identifier of the swap
   * @returns {String}
   */
  get id () {
    return SWAP_INSTANCES.get(this).id
  }

  /**
   * The hash of the secret
   * @returns {String}
   */
  get secretHash () {
    return SWAP_INSTANCES.get(this).secretHash
  }

  /**
   * The holder of the secret to the atomic swap
   * @returns {Party}
   */
  get secretHolder () {
    return SWAP_INSTANCES.get(this).secretHolder
  }

  /**
   * The seeker of the secret to the atomic swap
   * @returns {Party}
   */
  get secretSeeker () {
    return SWAP_INSTANCES.get(this).secretSeeker
  }

  /**
   * The current status of the atomic swap
   * @returns {String}
   */
  get status () {
    return SWAP_INSTANCES.get(this).status
  }

  /**
   * Returns the current state of the server as a JSON string
   * @type {String}
   */
  [Symbol.for('nodejs.util.inspect.custom')] () {
    return this.toJSON()
  }

  /**
   * Returns the JSON representation of the swap
   * @returns {Object}
   */
  toJSON () {
    return SWAP_INSTANCES.get(this)
  }

  /**
   * Returns whether the specified user is a party to the swap
   * @param {Object|User|Party} user The user to validate
   * @param {String} user.id The unique identifier of the user
   * @returns {Boolean}
   */
  isParty (user) {
    return user.id === this.secretHolder.id || user.id === this.secretSeeker.id
  }

  /**
   * Handles opening of the swap by one of its parties
   * @param {Party} party The party that is opening the swap
   * @param {String} party.id The unique identifier of the party
   * @param {*} party.state Private data that may be shared with the other party
   * @returns {Promise<Party>}
   */
  open (party) {
    const { secretHolder, secretSeeker, status } = this
    const isHolder = party.id === secretHolder.id
    const isSeeker = party.id === secretSeeker.id
    const isBoth = isHolder && isSeeker
    const isNeither = !isHolder && !isSeeker

    if (status !== SWAP_STATUS[0] && status !== SWAP_STATUS[1]) {
      const err = Error(`swap "${this.id}" is already "${status}"!`)
      return Promise.reject(err)
    } else if (isBoth) {
      const err = Error('self-swapping is not allowed!')
      return Promise.reject(err)
    } else if (isNeither) {
      const err = Error(`"${party.id}" not a party to swap "${this.id}"!`)
      return Promise.reject(err)
    }

    const { state } = party
    party = isHolder ? secretHolder : secretSeeker
    party.state = Object.freeze(Object.assign({}, party.state, state))

    return party.open()
      .then(party => {
        const isOpened = !!(secretHolder.state && secretSeeker.state)
        SWAP_INSTANCES.get(this).status = isOpened
          ? SWAP_STATUS[2]
          : SWAP_STATUS[1]

        return party
      })
  }

  /**
   * Handles committing to the swap by one of its parties
   * @param {Party} party The party that is opening the swap
   * @param {String} party.id The unique identifier of the party
   * @returns {Promise<Party>}
   */
  commit (party) {
    return new Promise((resolve, reject) => {
      const { secretHolder, secretSeeker, status } = this
      const isHolder = party.id === secretHolder.id
      const isSeeker = party.id === secretSeeker.id
      const isBoth = isHolder && isSeeker
      const isNeither = !isHolder && !isSeeker

      if (status !== SWAP_STATUS[2] && status !== SWAP_STATUS[3]) {
        const err = Error(`swap "${this.id}" is already "${status}"!`)
        return Promise.reject(err)
      } else if (isBoth) {
        const err = Error('self-swapping is not allowed!')
        return Promise.reject(err)
      } else if (isNeither) {
        const err = Error(`"${party.id}" not a party to swap "${this.id}"!`)
        return Promise.reject(err)
      }

      party = isHolder ? secretHolder : secretSeeker

      return party.commit()
        .then(party => {
          const isCommitted = !!(secretHolder.state && secretSeeker.state)
          SWAP_INSTANCES.get(this).status = isCommitted
            ? SWAP_STATUS[4]
            : SWAP_STATUS[3]

          return party
        })
    })
  }

  /**
   * Creates an atomic swap for settling a pair of orders
   * @param {Order} makerOrder The maker of the order
   * @param {Order} takerOrder The taker of the order
   * @returns {Swap}
   */
  static fromOrders (makerOrder, takerOrder) {
    const id = hash(makerOrder.id, takerOrder.id)
    const secretHash = makerOrder.hash
    const secretHolder = Party.fromMakerOrder(makerOrder)
    const secretSeeker = Party.fromTakerOrder(takerOrder)

    return new Swap({ id, secretHash, secretHolder, secretSeeker })
  }
}
