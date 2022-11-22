/**
 * @file Specification for the Limit Orderbook
 */

const { expect } = require('chai')

describe('Orderbook - Limit', function () {
  const PROPS = Object.freeze({
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
  })

  describe('Add/delete limit order', function () {
    let order = null // tracks the order that is first added, and then deleted

    it('must add a new order to the orderbook', function () {
      const { client } = this.test.ctx
      const O = PROPS

      return client.submitLimitOrder(O)
        .then(o => {
          expect(o).to.be.an('object')
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

    it('must remove an existing order from the orderbook', function () {
      const { client } = this.test.ctx
      const O = PROPS

      return client.cancelLimitOrder(order)
        .then(o => {
          expect(o).to.be.an('object')
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
        })
    })
  })

  describe('Updates/Notifications', function () {
    before('submit an order', function (done) {
      const { client } = this.test.ctx
      const O = PROPS

      const validateOrder = o => {
        expect(o).to.be.an('object')
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
      }

      client
        .on('message', function onMessage (o) {
          validateOrder(o)
          expect(o.reason).to.equal(null)

          if (o.status === 'opened') {
            expect(o.reason).to.equal(null)
            client.off('message', onMessage)
            done()
          }
        })
        .submitLimitOrder(O)
        .then(o => {
          validateOrder(o)
          expect(o.status).to.be.a('string').that.equals('created')
          expect(o.reason).to.equal(null)
        })
    })

    it('must submit a counter-order to match previous order', function () {
      const { client } = this.test.ctx
      const O = Object.assign({}, PROPS, { side: 'ask' })

      client
        .submitLimitOrder(O)
        .then(o => {
          expect(o).to.be.an('object')
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
          expect(o.status).to.be.a('string').that.equals('created')
          expect(o.reason).to.equal(null)
        })
    })
  })

  describe('Error Handling', function () {
    describe('adding an order', function () {
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

    describe('deleting an order', function () {
      it('must throw an error when the order ID is missing')
      it('must throw an error when baseAsset is unsupported')
      it('must throw an error when quoteAsset is unsupported')
    })
  })
})
