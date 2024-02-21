/**
 * @file Interface to the Ethereum network
 */

const { Blockchain } = require('@portaldefi/core')
const { Web3, WebSocketProvider } = require('web3')

/**
 * Holds private fields for instances of the class
 * @type {WeakMap}
 */
const INSTANCES = new WeakMap()

/**
 * Interface to the Ethereum network
 * @type {Ethereum}
 */
module.exports = class Ethereum extends Blockchain {
  constructor (sdk, props) {
    super({ id: 'ethereum' })

    if (props == null) {
      throw Error('no properties specified!')
    } else if (props.url == null || typeof props.url !== 'string') {
      throw Error('no url specified for geth!')
    } else if (props.private == null || typeof props.private !== 'string') {
      throw Error('no wallet private key specified!')
    } else if (props.contracts == null) {
      throw Error('no solidity contracts provided!')
    } else if (props.chainId == null) {
      throw Error('no chain identifier specified!')
    }

    INSTANCES.set(this, Object.seal({
      props,
      web3: null,
      wallet: null,
      contract: null,
      events: null,
      json: null
    }))

    Object.freeze(this)
  }

  /**
   * Returns the JSON representation of the swap
   * @returns {Object}
   */
  toJSON () {
    return Object.assign(super.toJSON(), INSTANCES.get(this).json)
  }

  /**
   * Connects to the geth daemon to initializes the instance
   *
   * This entails a few steps:
   * - initializes the web3 instance with reasonable defaults
   * - retrieve details of the user's wallet from the geth node
   * - subscribe to swap contract events
   *
   * @returns {Promise<Ethereum>}
   */
  async connect () {
    return new Promise((resolve, reject) => {
      const state = INSTANCES.get(this)
      const { props } = state

      // web3-provider: use the WebSocketProvider to enable event streaming
      const provider = new WebSocketProvider(props.url)
      provider.once('connect', () => {
        this.info('connect', this)
        this.emit('connect', this)
        resolve(this)
      })
      provider.once('error', err => {
        this.error('connect', err, this)
        reject(err)
      })

      // web3
      const web3 = new Web3(provider)

      // account/wallet
      const wallet = web3.eth.accounts.wallet.add(props.private)

      // default configuration
      web3.eth.defaultAccount = wallet[0].address
      web3.eth.Contract.handleRevert = true

      // swap contract
      const { abi, address } = props.contracts.Swap
      const { address: from } = wallet[0]
      const contract = new web3.eth.Contract(abi, address, { from })
      contract.handleRevert = true
      contract.defaultAccount = wallet[0].address
      contract.defaultChain = 'playnet'
      contract.defaultHardfork = 'london'
      contract.defaultNetworkId = props.chainId
      contract.defaultCommon = {
        name: 'playnet',
        chainId: props.chainId,
        networkId: props.chainId
      }

      // swap contract events
      const events = contract.events.allEvents()
      events.on('connected', id => this.debug('contract.events', { id }))
      events.on('data', data => {
        const { event, address, returnValues } = data

        if (contract._address.toLowerCase() !== address) {
          const msg = `got event from ${address}; expected ${contract._address}`
          const err = Error(msg)
          this.error('invoice.event', err, this)
          this.emit('error', err)
          return
        }

        switch (event) {
          case 'InvoiceCreated': {
            const { id, swap, payee, asset, quantity } = returnValues
            const invoice = { id, swap: { id: swap }, payee, asset, quantity }
            this.info('invoice.created', invoice, this)
            this.emit('invoice.created', invoice, this)
            break
          }

          case 'InvoicePaid': {
            const { id, swap, payer, asset, quantity } = returnValues
            const invoice = { id, swap: { id: swap }, payer, asset, quantity }
            this.info('invoice.paid', invoice, this)
            this.emit('invoice.paid', invoice, this)
            break
          }

          case 'InvoiceSettled': {
            const { id, swap, payer, payee, asset, quantity } = returnValues
            const invoice = {
              id,
              swap: { id: swap, secret: returnValues.secret.substr(2) },
              payer,
              payee,
              asset,
              quantity
            }
            this.info('invoice.settled', invoice, this)
            this.emit('invoice.settled', invoice, this)
            break
          }

          default:
            this.debug('event', data)
        }
      })
      events.on('changed', data => this.warn('contract.changed', data))
      events.on('error', (err, ...args) => {
        this.error('contract.error', err, ...args)
      })

      // json
      const json = {
        wallet: wallet[0].address,
        contract: { address: contract._address }
      }

      // save state needed for later
      state.web3 = web3
      state.wallet = wallet
      state.contract = contract
      state.events = events
      state.json = json
    })
  }

  /**
   * Creates an invoice
   * @param {Party} party The party that will pay the invoice
   * @param {Number} party.quantity The number of tokens to be invoiced
   * @param {Swap} party.swap The parent swap of the party
   * @param {String} party.swap.id The unique identifier of the swap
   * @param {String} party.swap.secretHash The hash of the secret of the swap
   * @returns {Promise<Invoice>} The invoice generated by the Swap contract
   */
  async createInvoice (party) {
    try {
      const { web3, contract } = INSTANCES.get(this)
      const { methods: { createInvoice } } = contract
      const { toHex } = web3.utils

      const id = toHex(party.swap.secretHash)
      const swap = toHex(party.swap.id)
      const asset = '0x0000000000000000000000000000000000000000'
      const value = toHex(party.quantity)

      const tx = createInvoice(id, swap, asset, value)
      const gas = await tx.estimateGas()
      const receipt = await tx.send({ gas })
      this.info('createInvoice', receipt, party, this)

      const { blockHash, from, to, transactionHash } = receipt
      return { blockHash, from, to, transactionHash }
    } catch (err) {
      this.error('createInvoice', err, party, this)
      throw err
    }
  }

  /**
   * Pays an invoice
   * @param {Party} party The party that is paying the invoice
   * @param {Number} party.invoice The invoice to be paid
   * @param {Number} party.quantity The number of tokens to be invoiced
   * @param {Swap} party.swap The parent swap of the party
   * @param {String} party.swap.id The unique identifier of the swap
   * @param {String} party.swap.secretHash The hash of the secret of the swap
   * @returns {Promise<Void>}
   */
  async payInvoice (party) {
    try {
      const { web3, contract } = INSTANCES.get(this)
      const { methods: { payInvoice } } = contract
      const { toHex } = web3.utils

      const id = toHex(party.swap.secretHash)
      const swap = toHex(party.swap.id)
      const asset = '0x0000000000000000000000000000000000000000'
      const value = toHex(party.quantity)

      const tx = payInvoice(id, swap, asset, value)
      // TODO: fix value to only be used for ETH transactions
      const gas = await tx.estimateGas({ value })
      const receipt = await tx.send({ gas, value })

      this.info('payInvoice', receipt, party, this)
      // TODO: This should be an Invoice object
      return null
    } catch (err) {
      this.error('payInvoice', err, party, this)
      throw err
    }
  }

  /**
   * Settles an invoice
   * @param {Party} party The party that is settling the invoice
   * @param {Number} party.invoice The invoice to be settled
   * @param {String} secret The secret to be revealed
   * @returns {Promise<Void>}
   */
  async settleInvoice (party, secret) {
    try {
      const { web3, contract } = INSTANCES.get(this)
      const { methods: { settleInvoice } } = contract
      const { toHex } = web3.utils

      const swap = toHex(party.swap.id)
      const tx = settleInvoice(`0x${secret}`, swap)
      const gas = await tx.estimateGas()
      const receipt = await tx.send({ gas })

      this.info('settleInvoice', receipt, party, this)
      // TODO: This should be an Invoice object
      return null
    } catch (err) {
      this.error('settleInvoice', err, party, this)
      throw err
    }
  }

  /**
   * Gracefully disconnects from the geth daemon
   * @returns {Promise<Ethereum>}
   */
  async disconnect () {
    return new Promise((resolve, reject) => {
      const { web3: { provider }, events } = INSTANCES.get(this)
      events.unsubscribe()
        .then(() => {
          provider.once('disconnect', () => {
            this.emit('disconnect', this)
            resolve(this)
          })
          provider.once('error', err => {
            this.error('disconnect', err, this)
            reject(err)
          })
          provider.disconnect()
        })
        .catch(reject)
    })
  }
}
