/**
 * @file Implements an orderbook for a single asset-pair
 */

const { BaseClass } = require('@portaldefi/core')

const priceFn = { ask: Math.min, bid: Math.max }
const priceDefault = { ask: Number.MAX_VALUE, bid: 0 }

/**
 * Implements an orderbook for a single asset-pair
 * @type {Orderbook}
 */
module.exports = class Orderbook extends BaseClass {
  /**
   * Instantiates a new orderbook for the specfied asset-pair
   * @param {Object} props Properties of the orderbook
   * @param {String} props.baseAsset The symbol of the asset being bought/sold
   * @param {String} props.quoteAsset The symbol of the asset used for payment
   * @param {Number} props.limitSize Reciprocal of the smallest limit price
   */
  constructor (props) {
    if (props == null) {
      throw new Error('instantiated without arguments!')
    } else if (props.baseAsset == null) {
      throw new Error('instantiated without baseAsset!')
    } else if (props.quoteAsset == null) {
      throw new Error('instantiated without quoteAsset!')
    } else if (isNaN(+props.limitSize) || +props.limitSize <= 0) {
      throw new Error('instantiated with invalid limitSize!')
    }

    super({ id: `${props.baseAsset}-${props.quoteAsset}` })

    this.baseAsset = props.baseAsset
    this.quoteAsset = props.quoteAsset
    this.limitSize = props.limitSize

    this.side = { ask: new Map(), bid: new Map() }
    this.best = { ...priceDefault }
    this.orders = new Map()
    this.queues = {
      cancel: new Set(),
      limit: { ask: new Set(), bid: new Set() }
    }

    this._id = null

    Object.seal(this)
  }

  /**
   * The asset pair tracked/traded by the orderbook
   */
  get assetPair () {
    return this.id
  }

  /**
   * The spread of the orderbook
   * @returns {Number}
   */
  get spread () {
    return this.best.ask - this.best.bid
  }

  /**
   * The current price of the asset, in terms of the quote asset
   * @returns {Number}
   */
  get price () {
    return (this.best.ask + this.best.bid) / 2
  }

  /**
   * Returns the current state of the instance
   * @type {String}
   */
  [Symbol.for('nodejs.util.inspect.custom')] () {
    return this.toJSON()
  }

  /**
  * Returns the current state of the instance
  * @returns {Object}
  */
  toJSON () {
    return {
      '@type': this.constructor.name,
      assetPair: this.assetPair,
      limitSize: this.limitSize,
      price: this.price,
      spread: this.spread,
      orders: this.orders.size,
      queues: {
        cancel: this.queues.cancel.size,
        limit: {
          ask: this.queues.limit.ask.size,
          bid: this.queues.limit.bid.size
        }
      }
    }
  }

  /**
   * Adds a new order
   * @param {Object} order The order to be added
   * @returns {Promise<Void>}
   */
  add (order) {
    if (!this.orders.has(order.id)) {
      this.queues[order.type][order.side].add(order)
      return this._trigger(order)
    }

    return Promise.reject(this.orders.get(order.id).equals(order)
      ? Error(`order ${order.id} already exists!`)
      : Error('order-equality error OR uuid collision!'))
  }

  /**
   * Cancels a previously added order
   * @param {Object} order The order to be cancelled
   * @returns {Promise<Void>}
   */
  cancel (order) {
    if (this.orders.has(order.id)) {
      order = this.orders.get(order.id).order
      this.queues.cancel.add(order)
      return this._trigger(order)
    }

    return Promise.reject(Error(`order ${order.id} does not exist!`))
  }

  /**
   * Triggers matching, if needed
   * @param {*} args Arguments to be emitted/returned
   * @returns {Promise<Order>}
   */
  _trigger (order) {
    this._id = this._id || setImmediate(() => this._execute())
    this.emit('created', order)
    return Promise.resolve(order)
  }

  /**
   * Executes all queued orders
   * @returns {Void}
   */
  _execute () {
    try {
      const closed = []
      const opened = []
      const matched = []

      // process any queued cancellations
      for (const cancellation of this.queues.cancel) {
        const orders = this.orders
        if (!orders.has(cancellation.id)) continue

        const { curPrice, order } = orders.get(cancellation.id)
        const limitOrders = this.side[order.side].get(curPrice)

        limitOrders.delete(order)
        orders.delete(order.id)
        closed.push(order.close('cancelled'))

        // if the cancellation has affected the best bid/ask, then update it
        if (this.best[order.side] !== curPrice || limitOrders.size) continue

        // reset the price default to recalculate the best ask/bid price
        this.best[order.side] = priceDefault[order.side]
        for (const [curPrice, orders] of this.side[order.side]) {
          if (orders.size === 0) continue
          this.best[order.side] = priceFn[order.side](this.best[order.side], curPrice)
        }
      }
      this.queues.cancel.clear()

      // process limit ask orders
      for (const order of this.queues.limit.ask) {
        const tmp = order.price * this.limitSize
        const curPrice = (tmp - (tmp % 1)) / this.limitSize

        this.side.ask.has(curPrice) || this.side.ask.set(curPrice, new Set())
        this.side.ask.get(curPrice).add(order)
        this.best.ask = priceFn.ask(this.best.ask, curPrice)
        this.orders.set(order.id, { curPrice, order })

        opened.push(order.open())
      }
      this.queues.limit.ask.clear()

      // process limit bid orders
      for (const order of this.queues.limit.bid) {
        const tmp = order.price * this.limitSize
        const curPrice = (tmp - (tmp % 1)) / this.limitSize

        this.side.bid.has(curPrice) || this.side.bid.set(curPrice, new Set())
        this.side.bid.get(curPrice).add(order)
        this.best.bid = priceFn.bid(this.best.bid, curPrice)
        this.orders.set(order.id, { curPrice, order })

        opened.push(order.open())
      }
      this.queues.limit.bid.clear()

      // resolve overlapping limit orders
      while (this.spread <= 0) {
        const tmp = this.price * this.limitSize
        const curPrice = (tmp - (tmp % 1)) / this.limitSize
        const asks = this.side.ask.get(curPrice)
        const bids = this.side.bid.get(curPrice)

        while (asks.size && bids.size) {
          const ask = asks.values().next().value
          const bid = bids.values().next().value

          if (ask.baseQuantity === bid.baseQuantity) {
            asks.delete(ask)
            bids.delete(bid)
            this.orders.delete(ask.id)
            this.orders.delete(bid.id)
          } else if (ask.baseQuantity > bid.baseQuantity) {
            ask.match(bid)
            bids.delete(bid)
            this.orders.delete(bid.id)
          } else if (ask.baseQuantity < bid.baseQuantity) {
            asks.delete(ask)
            bid.match(ask)
            this.orders.delete(ask.id)
          }

          // if we're out of asks for the current limit price, then update it
          if (asks.size === 0) {
            this.best.ask = priceDefault.ask
            for (const [curPrice, orders] of this.side.ask) {
              if (orders.size === 0) continue
              this.best.ask = priceFn.ask(this.best.ask, curPrice)
            }
          }

          // if we're out of bids for the current limit price, then update it
          if (bids.size === 0) {
            this.best.bid = priceDefault.bid
            for (const [curPrice, orders] of this.side.bid) {
              if (orders.size === 0) continue
              this.best.bid = priceFn.bid(this.best.bid, curPrice)
            }
          }

          const maker = ask.ts <= bid.ts ? ask : bid
          const taker = ask.ts <= bid.ts ? bid : ask
          matched.push({ maker, taker })
        }
      }

      // fire all events
      for (const order of closed) {
        this.emit(order.status, order)
      }

      for (const order of opened) {
        this.emit(order.status, order)
      }

      for (const { maker, taker } of matched) {
        this.emit('match', maker, taker)
      }

      // ack the execution
      this._id = null
    } catch (err) {
      this.emit('error', err)
    }
  }
}
