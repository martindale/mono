/**
 * @file Behavioral specification for the Orderbook
 */

const { expect } = require('chai')
const Order = require('../../../lib/core/order')
const Orderbook = require('../../../lib/core/orderbook')

describe('Orderbook', function () {
  const PROPS = {
    baseAsset: 'BTC',
    quoteAsset: 'ETH',
    limitSize: 100
  }

  /**
   * Tests instantiation behavior
   */
  describe('Instantiation', function () {
    it('must throw when instantiated without required arguments', function () {
      expect(() => new Orderbook()).to.throw()
      expect(() => new Orderbook({})).to.throw()
      expect(() => new Orderbook({ baseAsset: 'BTC' })).to.throw()
      expect(() => new Orderbook({ quoteAsset: 'ETH' })).to.throw()
      expect(() => new Orderbook({ limitPrice: 0 })).to.throw()
      expect(() => new Orderbook({ limitPrice: -10 })).to.throw()
      expect(() => new Orderbook({ limitPrice: 10 })).to.throw()
    })

    it('must return a valid instance when instantiated correctly', function () {
      let ob = null
      expect(() => { ob = new Orderbook(PROPS) }).to.not.throw()
      expect(ob).to.be.an.instanceof(Orderbook)
      /* eslint-disable-next-line no-unused-expressions */
      expect(ob).to.be.sealed
      expect(ob.assetPair).to.be.a('string').that.equals('BTC-ETH')
      expect(ob.baseAsset).to.be.a('string').that.equals('BTC')
      expect(ob.quoteAsset).to.be.a('string').that.equals('ETH')
      expect(ob.limitSize).to.be.a('number').that.equals(100)
      expect(ob.side.ask).to.be.an.instanceof(Map)
      expect(ob.side.bid).to.be.an.instanceof(Map)
      expect(ob.best.ask).to.be.a('number').that.equals(Number.MAX_VALUE)
      expect(ob.best.bid).to.be.a('number').that.equals(0)
      expect(ob.orders).to.be.an.instanceof(Map)
      expect(ob.queues).to.be.an('object')
      expect(ob.queues.cancel).to.be.an.instanceof(Set)
      expect(ob.queues.limit).to.be.an('object')
      expect(ob.queues.limit.ask).to.be.an.instanceof(Set)
      expect(ob.queues.limit.bid).to.be.an.instanceof(Set)
      expect(ob.spread).to.be.a('number').that.equals(Number.MAX_VALUE)
      expect(ob.price).to.be.a('number').that.equals(Number.MAX_VALUE / 2)
      expect(ob._id).to.equal(null)
    })
  })

  /**
   * Regular operational behavior testing
   */
  describe('Operation', function () {
    let ob

    /**
     * Create a fresh orderbook at the start of the suite
     * @returns {Void}
     */
    before(function () { ob = new Orderbook(PROPS) })

    /**
     * Destroy the orderbook at the end of the suite
     * @returns {Void}
     */
    after(function () { ob = null })

    /**
     * Order management user stories
     */
    describe('Order Management', function () {
      const BASE_ORDER = {
        uid: 'uid',
        type: 'limit',
        baseAsset: 'BTC',
        baseNetwork: 'lightning.btc',
        quoteAsset: 'ETH',
        quoteNetwork: 'ethereum'
      }
      const askOrder = new Order(Object.assign({}, BASE_ORDER, {
        side: 'ask',
        hash: 'hash',
        baseQuantity: 1,
        quoteQuantity: 1100
      }))
      const bidOrder = new Order(Object.assign({}, BASE_ORDER, {
        side: 'bid',
        hash: 'hash',
        baseQuantity: 1,
        quoteQuantity: 1000
      }))

      /**
       * Tests the addition of an ask limit order
       *
       * Calls `.add()` to add `askOrder`, and validates the returned valud, as
       * well as the `created` and  opened` events, checking the order as it
       * moves through its states.
       *
       * @param {Function} done Function executed upon completion of test
       * @returns {Void}
       */
      it('must correctly add a new ask limit order', function (done) {
        let orderCreated = false
        let orderOpened = false
        let actualChecks = 0
        const expectedChecks = 3
        const check = () => (++actualChecks === expectedChecks) && done()

        ob
          .once('created', order => {
            // no event should have fired at this stage
            expect(orderCreated).to.equal(false)
            expect(orderOpened).to.equal(false)

            // the event should report the incoming order
            expect(order).to.deep.equal(askOrder)

            // validate the state of the orderbook
            expect(ob.best.ask).to.be.a('number').that.equals(Number.MAX_VALUE)
            expect(ob.best.bid).to.be.a('number').that.equals(0)
            expect(ob.spread).to.be.a('number').that.equals(Number.MAX_VALUE)
            expect(ob.price).to.be.a('number').that.equals(Number.MAX_VALUE / 2)

            orderCreated = true
            check()
          })
          .once('opened', order => {
            // the `created` event should have fired by now
            expect(orderCreated).to.equal(true)
            expect(orderOpened).to.equal(false)

            // the event should return the order as it was sent
            expect(order).to.deep.equal(askOrder)
            // the cancel queue should have been fully processed by now
            expect(ob.queues.cancel).to.have.lengthOf(0)
            // limit order queue should have been exhausted
            expect(ob.queues.limit.bid).to.have.lengthOf(0)

            // validate the state of the orderbook
            expect(ob.best.ask).to.be.a('number').that.equals(1100)
            expect(ob.best.bid).to.be.a('number').that.equals(0)
            expect(ob.spread).to.be.a('number').that.equals(1100)
            expect(ob.price).to.be.a('number').that.equals(550)

            orderOpened = true
            check()
          })
          .add(askOrder).then(() => {
            // the `created` event should have fired by now
            expect(orderCreated).to.equal(true)
            expect(orderOpened).to.equal(false)

            // the order should be queued for processing
            expect(ob.queues.limit.ask).to.have.lengthOf(1)
            // matching should be queued for the next tick
            expect(ob._id).to.not.equal(null)

            // validate the state of the orderbook
            expect(ob.best.ask).to.be.a('number').that.equals(Number.MAX_VALUE)
            expect(ob.best.bid).to.be.a('number').that.equals(0)
            expect(ob.spread).to.be.a('number').that.equals(Number.MAX_VALUE)
            expect(ob.price).to.be.a('number').that.equals(Number.MAX_VALUE / 2)

            check()
          })
          .catch(done)
      })

      /**
       * Tests the addition of a bid limit order
       *
       * Calls `.add()` to add `bidOrder`, and validates the returned valud, as
       * well as the `created` and  opened` events, checking the order as it
       * moves through its states.
       *
       * @param {Function} done Function executed upon completion of test
       * @returns {Void}
       */
      it('must correctly add a new bid limit order', function (done) {
        let orderCreated = false
        let orderOpened = false
        let actualChecks = 0
        const expectedChecks = 3
        const check = () => (++actualChecks === expectedChecks) && done()

        ob
          .once('created', order => {
            // no event should have fired at this stage
            expect(orderCreated).to.equal(false)
            expect(orderOpened).to.equal(false)

            // the event should return the order as it was sent
            expect(order).to.equal(bidOrder)
            expect(order.status).to.equal('created')

            // validate the state of the orderbook
            expect(ob.best.ask).to.be.a('number').that.equals(1100)
            expect(ob.best.bid).to.be.a('number').that.equals(0)
            expect(ob.spread).to.be.a('number').that.equals(1100)
            expect(ob.price).to.be.a('number').that.equals(550)

            orderCreated = true
            check()
          })
          .once('opened', order => {
            // the `created` event should have fired by now
            expect(orderCreated).to.equal(true)
            expect(orderOpened).to.equal(false)

            // the event should return the order as it was sent
            expect(order).to.equal(bidOrder)
            expect(order.status).to.equal('opened')

            // the cancel queue should have been fully processed by now
            expect(ob.queues.cancel).to.have.lengthOf(0)
            // limit order queue should have been exhausted
            expect(ob.queues.limit.bid).to.have.lengthOf(0)

            // validate the state of the orderbook
            expect(ob.best.ask).to.be.a('number').that.equals(1100)
            expect(ob.best.bid).to.be.a('number').that.equals(1000)
            expect(ob.spread).to.be.a('number').that.equals(100)
            expect(ob.price).to.be.a('number').that.equals(1050)

            orderOpened = true
            check()
          })
          .add(bidOrder).then(order => {
            // the `created` event should have fired by now
            expect(orderCreated).to.equal(true)
            expect(orderOpened).to.equal(false)

            // the event should return the order as it was sent
            expect(order).to.equal(bidOrder)
            expect(order.status).to.equal('created')

            // the order should be queued for processing
            expect(ob.queues.limit.bid).to.have.lengthOf(1)
            // matching should be queued for the next tick
            expect(ob._id).to.not.equal(null)

            // validate the state of the orderbook
            expect(ob.best.ask).to.be.a('number').that.equals(1100)
            expect(ob.best.bid).to.be.a('number').that.equals(0)
            expect(ob.spread).to.be.a('number').that.equals(1100)
            expect(ob.price).to.be.a('number').that.equals(550)

            check()
          })
          .catch(done)
      })

      /**
       * Tests the cancellation of the previously-added ask limit order
       *
       * Calls `.cancel()` to add `askOrder`, and validates the returned value,
       * as well as the `created` and  `closed` events, checking the order as it
       * moves through its states.
       *
       * @param {Function} done Function executed upon completion of test
       * @returns {Void}
       */
      it('must cancel an existing ask limit order', function (done) {
        let orderCreated = false
        let orderClosed = false
        let actualChecks = 0
        const expectedChecks = 3
        const check = () => (++actualChecks === expectedChecks) && done()

        ob
          .once('created', order => {
            // the `created` event should have fired by now
            expect(orderCreated).to.equal(false)
            expect(orderClosed).to.equal(false)

            orderCreated = true
            check()
          })
          .once('closed', order => {
            expect(ob.best.ask).to.be.a('number').that.equals(Number.MAX_VALUE)
            expect(ob.best.bid).to.be.a('number').that.equals(1000)
            expect(ob.spread).to.be.a('number').that.equals(Number.MAX_VALUE)
            expect(ob.price).to.be.a('number').that.equals(Number.MAX_VALUE / 2)

            orderClosed = true
            check()
          })
          .cancel({ id: askOrder.id }).then(() => {
            // the `created` event should have fired by now
            expect(orderCreated).to.equal(true)
            expect(orderClosed).to.equal(false)

            expect(ob.best.ask).to.be.a('number').that.equals(1100)
            expect(ob.best.bid).to.be.a('number').that.equals(1000)
            expect(ob.spread).to.be.a('number').that.equals(100)
            expect(ob.price).to.be.a('number').that.equals(1050)

            check()
          })
          .catch(done)
      })

      /**
       * Tests the cancellation of the previously-added bid limit order
       *
       * Calls `.cancel()` to add `bidOrder`, and validates the returned value,
       * as well as the `created` and  `closed` events, checking the order as it
       * moves through its states.
       *
       * @param {Function} done Function executed upon completion of test
       * @returns {Void}
       */
      it('must cancel an existing bid limit order', function (done) {
        let orderCreated = false
        let orderClosed = false
        let actualChecks = 0
        const expectedChecks = 3
        const check = () => (++actualChecks === expectedChecks) && done()

        ob
          .once('created', order => {
            expect(order).to.be.an.instanceof(Order)
            /* eslint-disable-next-line no-unused-expressions */
            expect(order).to.be.sealed

            // the `created` event should have fired by now
            expect(orderCreated).to.equal(false)
            expect(orderClosed).to.equal(false)

            orderCreated = true
            check()
          })
          .once('closed', order => {
            expect(order).to.be.an.instanceof(Order)
            /* eslint-disable-next-line no-unused-expressions */
            expect(order).to.be.sealed

            expect(ob.best.ask).to.be.a('number').that.equals(Number.MAX_VALUE)
            expect(ob.best.bid).to.be.a('number').that.equals(0)
            expect(ob.spread).to.be.a('number').that.equals(Number.MAX_VALUE)
            expect(ob.price).to.be.a('number').that.equals(Number.MAX_VALUE / 2)

            orderClosed = true
            check()
          })
          .cancel({ id: bidOrder.id }).then(o => {
            expect(o).to.be.an.instanceof(Order)
            /* eslint-disable-next-line no-unused-expressions */
            expect(o).to.be.sealed

            // the `created` event should have fired by now
            expect(orderCreated).to.equal(true)
            expect(orderClosed).to.equal(false)

            expect(ob.best.ask).to.be.a('number').that.equals(Number.MAX_VALUE)
            expect(ob.best.bid).to.be.a('number').that.equals(1000)
            expect(ob.spread).to.be.a('number').that.equals(Number.MAX_VALUE)
            expect(ob.price).to.be.a('number').that.equals(Number.MAX_VALUE / 2)

            check()
          })
          .catch(done)
      })
    })

    /**
     * Order management user stories
     */
    describe('Order Matching', function () {
      const BASE_ORDER = {
        uid: 'uid',
        type: 'limit',
        hash: 'hash',
        baseAsset: 'BTC',
        baseNetwork: 'lightning.btc',
        baseQuantity: 1,
        quoteAsset: 'ETH',
        quoteNetwork: 'ethereum',
        quoteQuantity: 1000
      }
      const askOrder = new Order(Object.assign({}, BASE_ORDER, { side: 'ask' }))
      const bidOrder = new Order(Object.assign({}, BASE_ORDER, { side: 'bid' }))

      before('initialize orderbook', function (done) {
        ob
          .once('opened', order => {
            expect(order).to.deep.equal(askOrder)
            expect(ob.orders.size).to.equal(1)
            done()
          })
          .add(askOrder)
      })

      after('cleanup orderbook', function () {
        ob = null
      })

      it('must match a pair of limit orders', function (done) {
        ob
          .once('match', (maker, taker) => {
            expect(maker).to.be.an.instanceof(Order).that.deep.equals(askOrder)
            expect(taker).to.be.an.instanceof(Order).that.deep.equals(bidOrder)
            done()
          })
          .add(bidOrder)
      })
    })
  })
})
