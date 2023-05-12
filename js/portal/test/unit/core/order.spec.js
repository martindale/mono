/**
 * @file Behavioral specification for an Order
 */

const { expect } = require('chai')
const Order = require('../../../lib/core/order')

describe('Order', function () {
  const PROPS = {
    uid: 'uid',
    type: 'limit',
    side: 'bid',
    hash: 'myhash',
    baseAsset: 'BTC',
    baseNetwork: 'lightning.btc',
    baseQuantity: 1,
    quoteAsset: 'ETH',
    quoteNetwork: 'ethereum',
    quoteQuantity: 10
  }

  /**
   * Tests instantiation behavior
   */
  describe('Instantiation', function () {
    it('must throw when instantiated without required arguments', function () {
      expect(() => new Order()).to.throw()
      expect(() => new Order({})).to.throw()

      for (const prop in PROPS) {
        const props = Object.assign({}, PROPS)
        delete props[prop]
        expect(() => new Order(props)).to.throw()
      }
    })

    it('must instantiate correctly with required arguments', function () {
      let o = null

      expect(() => { o = new Order(PROPS) }).to.not.throw()
      expect(o).to.be.an.instanceof(Order)
      /* eslint-disable-next-line no-unused-expressions */
      expect(o).to.be.sealed

      expect(o.id).to.be.a('string')
      expect(o.ts).to.be.a('number')
      expect(o.uid).to.be.a('string').that.equals(PROPS.uid)
      expect(o.type).to.be.a('string').that.equals(PROPS.type)
      expect(o.side).to.be.a('string').that.equals(PROPS.side)
      expect(o.hash).to.be.a('string').that.equals(PROPS.hash)
      expect(o.baseAsset).to.be.a('string').that.equals(PROPS.baseAsset)
      expect(o.baseNetwork).to.be.a('string').that.equals(PROPS.baseNetwork)
      expect(o.baseQuantity).to.be.a('number').that.equals(PROPS.baseQuantity)
      expect(o.quoteAsset).to.be.a('string').that.equals(PROPS.quoteAsset)
      expect(o.quoteNetwork).to.be.a('string').that.equals(PROPS.quoteNetwork)
      expect(o.quoteQuantity).to.be.a('number').that.equals(PROPS.quoteQuantity)
      expect(o.status).to.be.a('string').that.equals('created')
      expect(o.reason).to.equal(null)
    })
  })

  /**
   * Regular operational behavior testing
   */
  describe('Operation', function () {
    let order = null

    before(function () {
      order = new Order(PROPS)
    })

    /**
     * Tests creating a new order ensuring the state is valid
     */
    it('must be created correctly', function () {
      order = new Order(PROPS)

      expect(order.status).to.equal('created')
      expect(order.reason).to.equal(null)
    })

    it('must be opened correctly', function () {
      order.open('reason')

      expect(order.status).to.equal('opened')
      expect(order.reason).to.equal('reason')
    })

    it('must be cancelled correctly', function () {
      order.close('cancelled')

      expect(order.status).to.equal('closed')
      expect(order.reason).to.equal('cancelled')
    })
  })
})
