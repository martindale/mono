/**
 * @file Behavioral specification for interface to supported blockchain orderbooks
 */

const { expect } = require('chai')
const Order = require('../../../lib/core/order')
const Orderbooks = require('../../../lib/core/orderbooks')

describe('Orderbooks', function () {
  /**
   * Tests instantiation behavior
   */
  describe('Instantiation', function () {
    it('must correctly instantiate with specified orderbooks', function () {
      let orderbooks = null

      expect(() => { orderbooks = new Orderbooks() }).to.not.throw()
      expect(orderbooks).to.be.an.instanceof(Orderbooks)
      /* eslint-disable-next-line no-unused-expressions */
      expect(orderbooks).to.be.sealed
    })
  })

  /**
   * Regular operational behavior testing
   */
  describe('Operation', function () {
    const BASE_ORDER = {
      uid: 'uid',
      type: 'limit',
      baseAsset: 'BTC',
      baseNetwork: 'lightning.btc',
      quoteAsset: 'ETH',
      quoteNetwork: 'ethereum'
    }

    let orderbooks, order

    /**
     * Create a fresh orderbooks instance at the start of the suite
     * @returns {Void}
     */
    before(function () { orderbooks = new Orderbooks() })

    /**
     * Destroy the orderbooks instance at the end of the suite
     * @returns {Void}
     */
    after(function () { orderbooks = null })

    /**
     * Tests the addition a new order to the appropriate orderbook
     *
     * Saves the created order in the closure to make available for the rest of
     * the test suite.
     *
     * @returns {Void}
     */
    it('must add a new order to the appropriate orderbook', function () {
      return orderbooks
        .add(Object.assign({}, BASE_ORDER, {
          side: 'bid',
          hash: 'hash',
          baseQuantity: 1,
          quoteQuantity: 1000
        }))
        .then(o => {
          expect(o).to.be.an.instanceof(Order)
          order = o
        })
    })

    /**
     * Tests cancellation of an existing order from the appropriate orderbook
     * @returns {Void}
     */
    it('must cancel an order from the appropriate orderbook', function () {
      return orderbooks
        .cancel({
          id: order.id,
          baseAsset: order.baseAsset,
          quoteAsset: order.quoteAsset
        })
        .then(o => {
          expect(o).to.deep.equal(order)
          order = null
        })
    })
  })
})
