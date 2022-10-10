/**
 * @fle Behavioral specification for interface to supported blockchain orderbooks
 */

const { expect } = require('chai')
const Orderbook = require('../../lib/core/orderbook')
const Orderbooks = require('../../lib/core/orderbooks')

describe('Orderbooks', function () {
  describe('Instantiation', function () {
    it('must correctly instantiate with specified orderbooks', function () {
      let orderbooks = null

      expect(() => { orderbooks = new Orderbooks() }).to.not.throw()
      expect(orderbooks).to.be.an.instanceof(Orderbooks)
      /* eslint-disable-next-line no-unused-expressions */
      expect(orderbooks).to.be.sealed
    })
  })

  describe('Operation', function () {
    let orderbooks

    before(function () { orderbooks = new Orderbooks() })

    after(function () { orderbooks = null })

    describe('#get()', function () {
      it('must return the orderbook for the specified asset-pair', function () {
        const obj = { baseAsset: 'ETH', quoteAsset: 'USDC' }
        let orderbook
        expect(() => { orderbook = orderbooks.get(obj) }).to.not.throw()
        expect(orderbook).to.be.an.instanceof(Orderbook)
      })

      it('must throw an error for unknown asset-pairs', function () {
        const obj = { baseAsset: 'USDC', quoteAsset: 'ETH' }
        expect(() => orderbooks.get(obj)).to.throw()
      })
    })
  })
})
