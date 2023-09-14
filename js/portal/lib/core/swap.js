/**
 * @file Defines an instance of an atomic swap
 */

const Party = require('./party')
const { Util: { hash, uuid } } = require('@portaldefi/core')
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
      secretHash: props.secretHash, // hexString
      secretHolder: props.secretHolder,
      secretSeeker: props.secretSeeker,
      status: SWAP_STATUS[0]
    })

    SWAP_INSTANCES.get(this).secretHolder.swap = this
    SWAP_INSTANCES.get(this).secretSeeker.swap = this

    // TODO: freeze here?
    Object.seal(this)

    // Fire the event after allowing time for handlers to be registerd
    setImmediate(() => this.emit(this.status, this))
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
   * Returns whether or not the swap is in the `created` state
   * @returns {Boolean}
   */
  get isCreated () {
    return this.status === SWAP_STATUS[0]
  }

  /**
   * Returns whether or not the swap is in the `opening` state
   * @returns {Boolean}
   */
  get isOpening () {
    return this.status === SWAP_STATUS[1]
  }

  /**
   * Returns whether or not the swap is in the `opened` state
   * @returns {Boolean}
   */
  get isOpened () {
    return this.status === SWAP_STATUS[2]
  }

  /**
   * Returns whether or not the swap is in the `committing` state
   * @returns {Boolean}
   */
  get isCommitting () {
    return this.status === SWAP_STATUS[3]
  }

  /**
   * Returns whether or not the swap is in the `committed` state
   * @returns {Boolean}
   */
  get isCommitted () {
    return this.status === SWAP_STATUS[4]
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
    return Object.assign({
      '@type': this.constructor.name
    }, SWAP_INSTANCES.get(this))
  }

  /**
   * Returns whether or not the specified user is a party to the swap
   * @param {Party|Object} party.id The unique identifier of the party
   * @returns {Boolean}
   */
  isParty (party) {
    return this.secretHolder.id === party.id ||
           this.secretSeeker.id === party.id
  }

  /**
   * Handles opening of the swap by one of its parties
   * @param {Object} party The party that is opening the swap
   * @param {String} party.id The unique identifier of the party
   * @param {Object} opts Configuration options for the operation
   * @returns {Promise<Swap>}
   */
  async open (party, opts) {
    const { secretHolder, secretSeeker, status } = this
    const isHolder = party.id === secretHolder.id
    const isSeeker = party.id === secretSeeker.id
    const isBoth = isHolder && isSeeker
    const isNeither = !isHolder && !isSeeker

    if (status !== SWAP_STATUS[0] && status !== SWAP_STATUS[1]) {
      throw Error(`cannot open swap "${this.id}" when ${status}!`)
    } else if (isBoth) {
      throw Error('self-swapping is not allowed!')
    } else if (isNeither) {
      throw Error(`"${party.id}" not a party to swap "${this.id}"!`)
    }

    // NOTE: Mutation!!
    const { state } = party
    party = isHolder ? secretHolder : secretSeeker
    party.state = Object.assign({}, party.state, state)

    party = await party.open(opts)
    SWAP_INSTANCES.get(this).status = this.isOpening
      ? SWAP_STATUS[2]
      : SWAP_STATUS[1]
    this.emit(this.status, this)

    return this
  }

  /**
   * Handles committing to the swap by one of its parties
   * @param {Object} party The party that is opening the swap
   * @param {String} party.id The unique identifier of the party
   * @param {Object} opts Configuration options for the operation
   * @returns {Promise<Swap>}
   */
  async commit (party, opts) {
    const { secretHolder, secretSeeker, status } = this
    const isHolder = party.id === secretHolder.id
    const isSeeker = party.id === secretSeeker.id
    const isBoth = isHolder && isSeeker
    const isNeither = !isHolder && !isSeeker

    if (status !== SWAP_STATUS[2] && status !== SWAP_STATUS[3]) {
      throw Error(`cannot commit swap "${this.id}" when ${status}!`)
    } else if (isBoth) {
      throw Error('self-swapping is not allowed!')
    } else if (isNeither) {
      throw Error(`"${party.id}" not a party to swap "${this.id}"!`)
    }

    party = isHolder ? secretHolder : secretSeeker
    party = await party.commit(opts)
    SWAP_INSTANCES.get(this).status = this.isCommitting
      ? SWAP_STATUS[4]
      : SWAP_STATUS[3]
    this.emit(this.status, this)

    return this
  }

  /**
   * Creates an atomic swap for settling a pair of orders
   * @param {Order} makerOrder The maker of the order
   * @param {Order} takerOrder The taker of the order
   * @param {HttpContext} ctx The http context object
   * @returns {Swap}
   */
  static fromOrders (makerOrder, takerOrder, ctx) {
    const id = hash(makerOrder.id, takerOrder.id)
    const secretHash = makerOrder.hash
    const secretHolder = Party.fromOrder(makerOrder, ctx)
    const secretSeeker = Party.fromOrder(takerOrder, ctx)
    return new Swap({ id, secretHash, secretHolder, secretSeeker })
  }
}
