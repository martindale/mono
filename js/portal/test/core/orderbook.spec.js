/**
 * @fle Behavioral specification for the Orderbook
 */

const { expect } = require('chai')
const Order = require('../../lib/core/order')
const Orderbook = require('../../lib/core/orderbook')

describe('Orderbook', function () {
  const PROPS = {
    baseAsset: 'ETH',
    quoteAsset: 'USDC',
    limitSize: 100
  }

  describe('Instantiation', function () {
    it('must throw when instantiated without required arguments', function () {
      expect(() => new Orderbook()).to.throw()
      expect(() => new Orderbook({})).to.throw()
      expect(() => new Orderbook({ baseAsset: 'ETH' })).to.throw()
      expect(() => new Orderbook({ quoteAsset: 'USDC' })).to.throw()
      expect(() => new Orderbook({ limitPrice: 0 })).to.throw()
      expect(() => new Orderbook({ limitPrice: -10 })).to.throw()
      expect(() => new Orderbook({ limitPrice: 10 })).to.throw()
    })

    it('must return a valid instance when instantiated correctly', function () {
      let ob = null
      expect(() => { ob = new Orderbook(PROPS) }).to.not.throw()
      expect(ob).to.be.an.instanceof(Orderbook)
      expect(ob.baseAsset).to.be.a('string').that.equals(PROPS.baseAsset)
      expect(ob.quoteAsset).to.be.a('string').that.equals(PROPS.quoteAsset)
      expect(ob.limitSize).to.be.a('number').that.equals(PROPS.limitSize)
      expect(ob.orderCount).to.be.a('number').that.equals(0)
    })
  })

  describe('Operation', function () {
    let ob

    before(function () { ob = new Orderbook(PROPS) })

    after(function () { ob = null })

    describe('Expected', function () {
      const O = {
        uid: 'uid',
        type: 'limit',
        side: 'bid',
        hash: 'myhash',
        baseAsset: 'ETH',
        baseNetwork: 'goerli',
        baseQuantity: 1,
        quoteAsset: 'USDC',
        quoteNetwork: 'sepolia',
        quoteQuantity: 10
      }
      let order = null // tracks the order that is first added, and then deleted

      it('must add a new limit order and return it', function () {
        return ob.add(O).then(o => {
          expect(o).to.be.an.instanceof(Order)
          expect(o.id).to.be.a('string')
          expect(o.ts).to.be.a('number')
          expect(o.uid).to.be.a('string').that.equals(O.uid)
          expect(o.type).to.be.a('string').that.equals(O.type)
          expect(o.side).to.be.a('string').that.equals(O.side)
          expect(o.hash).to.be.a('string').that.equals(O.hash)
          expect(o.baseAsset).to.be.a('string').that.equals(O.baseAsset)
          expect(o.baseNetwork).to.be.a('string').that.equals(O.baseNetwork)
          expect(o.baseQuantity).to.be.a('number').that.equals(O.baseQuantity)
          expect(o.quoteAsset).to.be.a('string').that.equals(O.quoteAsset)
          expect(o.quoteNetwork).to.be.a('string').that.equals(O.quoteNetwork)
          expect(o.quoteQuantity).to.be.a('number').that.equals(O.quoteQuantity)

          order = o
        })
      })

      it('must delete an existing limit order and return it', function () {
        return ob.delete({ id: order.id }).then(o => {
          expect(o).to.be.an.instanceof(Order)
          expect(o.id).to.be.a('string')
          expect(o.ts).to.be.a('number')
          expect(o.uid).to.be.a('string').that.equals(O.uid)
          expect(o.type).to.be.a('string').that.equals(O.type)
          expect(o.side).to.be.a('string').that.equals(O.side)
          expect(o.hash).to.be.a('string').that.equals(O.hash)
          expect(o.baseAsset).to.be.a('string').that.equals(O.baseAsset)
          expect(o.baseNetwork).to.be.a('string').that.equals(O.baseNetwork)
          expect(o.baseQuantity).to.be.a('number').that.equals(O.baseQuantity)
          expect(o.quoteAsset).to.be.a('string').that.equals(O.quoteAsset)
          expect(o.quoteNetwork).to.be.a('string').that.equals(O.quoteNetwork)
          expect(o.quoteQuantity).to.be.a('number').that.equals(O.quoteQuantity)

          order = null
        })
      })
    })

    describe('Error Handling', function () {
      it('must throw an error when uid is missing')
      it('must throw an error when uid is not a string')

      it('must throw an error when type is missing')
      it('must throw an error when type is invalid')

      it('must throw an error when side is missing')
      it('must throw an error when side is invalid')

      it('must throw an error when baseAsset is unsupported')
      it('must throw an error when baseNetwork is unsupported')
      it('must throw an error when baseQuantity is invalid')

      it('must throw an error when quoteAsset is unsupported')
      it('must throw an error when quoteNetwork is unsupported')
      it('must throw an error when quoteQuantity is invalid')
    })
  })
})
