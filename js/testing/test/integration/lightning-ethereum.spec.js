/**
 * @file Behavioral specification for an EVM/Lightning atomic swap
 */

/**
 * This is a simple test case wherein
 */
describe('Swaps - Lightning/Ethereum', function () {
  const ORDER_PROPS = {
    baseAsset: 'BTC',
    baseNetwork: 'lightning.btc',
    baseQuantity: 10000,
    quoteAsset: 'ETH',
    quoteNetwork: 'ethereum',
    quoteQuantity: 100000
  }
  const prevState = { alice: null, bob: null }

  let secretHash = null

  function validate (user, swap) {
    expect(swap.id).to.be.a('string').with.lengthOf(64)
    expect(swap.secretHolder).to.be.an('object')
    expect(swap.secretHolder.id).to.be.a('string').that.equals('alice')
    expect(swap.secretSeeker).to.be.an('object')
    expect(swap.secretSeeker.id).to.be.a('string').that.equals('bob')

    if (swap.secretHolder.invoice !== null) {
      expect(swap.secretHolder.invoice).to.be.an('object')
      expect(swap.secretHolder.invoice.id).to.be.a('string')
      expect(swap.secretHolder.invoice.request).to.be.a('string')
      expect(swap.secretHolder.invoice.amount).to.be.a('number')
    }

    if (swap.secretSeeker.invoice !== null) {
      expect(swap.secretSeeker.invoice).to.be.an('object')
      expect(swap.secretSeeker.invoice.blockHash).to.be.a('string')
      expect(swap.secretSeeker.invoice.from).to.be.a('string')
      expect(swap.secretSeeker.invoice.to).to.be.a('string')
      expect(swap.secretSeeker.invoice.transactionHash).to.be.a('string')
    }

    prevState[user] = swap.status
  }

  before('test setup', function () {
    this.test.ctx.alice
      .on('swap.received', swap => {
        expect(prevState.alice).to.equal(null, 'alice')

        validate('alice', swap)
        expect(swap.status).to.be.a('string').that.equals('received')
        expect(swap.secretHash).to.equal(undefined)

        expect(swap.secretHolder.invoice).to.equal(null)
        expect(swap.secretSeeker.invoice).to.equal(null)
      })
      .on('swap.created', swap => {
        expect(prevState.alice).to.equal('received', 'alice')

        validate('alice', swap)
        expect(swap.status).to.be.a('string').that.equals('created')
        expect(swap.secretHash).to.be.a('string').with.lengthOf(64)

        expect(swap.secretHolder.invoice).to.equal(null)
        expect(swap.secretSeeker.invoice).to.equal(null)

        secretHash = swap.secretHash
      })
      .on('swap.holder.invoice.created', swap => {
        expect(prevState.alice).to.equal('created', 'alice')

        validate('alice', swap)
        expect(swap.status).to.be.a('string').that.equals('holder.invoice.created')
        expect(swap.secretHash).to.be.a('string').to.equal(secretHash)

        expect(swap.secretHolder.invoice).to.equal(null)
      })
      .on('swap.holder.invoice.sent', swap => {
        expect(prevState.alice).to.equal('holder.invoice.created', 'alice')

        validate('alice', swap)
        expect(swap.status).to.be.a('string').that.equals('holder.invoice.sent')
        expect(swap.secretHash).to.be.a('string').to.equal(secretHash)
      })
      .on('swap.seeker.invoice.created', swap => {
        throw Error('alice should not create seeker invoice as the secret holder!')
      })
      .on('swap.seeker.invoice.sent', swap => {
        expect(prevState.alice).to.equal('holder.invoice.sent', 'alice')

        validate('alice', swap)
        expect(swap.status).to.be.a('string').that.equals('seeker.invoice.sent')
        expect(swap.secretHash).to.be.a('string').that.equals(secretHash)
      })
      .on('swap.holder.invoice.paid', swap => {
        expect(prevState.alice).to.equal('seeker.invoice.sent', 'alice')

        validate('alice', swap)
        expect(swap.status).to.be.a('string').that.equals('holder.invoice.paid')
        expect(swap.secretHash).to.be.a('string').that.equals(secretHash)
      })
      .on('swap.seeker.invoice.paid', swap => {
        expect(prevState.alice).to.equal('holder.invoice.paid', 'alice')

        validate('alice', swap)
        expect(swap.status).to.be.a('string').that.equals('seeker.invoice.paid')
        expect(swap.secretHash).to.be.a('string').that.equals(secretHash)
      })
      .on('swap.holder.invoice.settled', swap => {
        expect(prevState.alice).to.equal('seeker.invoice.paid', 'alice')

        validate('alice', swap)
        expect(swap.status).to.be.a('string').that.equals('holder.invoice.settled')
        expect(swap.secretHash).to.be.a('string').that.equals(secretHash)
      })
      .on('swap.seeker.invoice.settled', swap => {
        expect(prevState.alice).to.equal('holder.invoice.settled', 'alice')

        validate('alice', swap)
        expect(swap.status).to.be.a('string').that.equals('seeker.invoice.settled')
        expect(swap.secretHash).to.be.a('string').that.equals(secretHash)
      })

    this.test.ctx.bob
      .on('swap.received', swap => {
        expect(prevState.bob).to.equal(null, 'bob')

        validate('bob', swap)
        expect(swap.status).to.be.a('string').that.equals('received')
        expect(swap.secretHash).to.equal(undefined)

        expect(swap.secretHolder.invoice).to.equal(null)
        expect(swap.secretSeeker.invoice).to.equal(null)
      })
      .on('swap.created', swap => {
        throw Error('bob should not create the swap as the secret seeker!')
      })
      .on('swap.holder.invoice.created', swap => {
        throw Error('bob should not create holder invoice as the secret seeker!')
      })
      .on('swap.holder.invoice.sent', swap => {
        expect(prevState.bob).to.equal('received', 'bob')

        validate('bob', swap)
        expect(swap.status).to.be.a('string').that.equals('holder.invoice.sent')
        expect(swap.secretHash).to.be.a('string').to.equal(secretHash)
        expect(swap.secretHolder.invoice).to.equal(null)
      })
      .on('swap.seeker.invoice.created', swap => {
        expect(prevState.bob).to.equal('holder.invoice.sent', 'bob')

        validate('bob', swap)
        expect(swap.status).to.be.a('string').that.equals('seeker.invoice.created')
        expect(swap.secretHash).to.be.a('string').that.equals(secretHash)
      })
      .on('swap.seeker.invoice.sent', swap => {
        expect(prevState.bob).to.equal('seeker.invoice.created', 'bob')

        validate('bob', swap)
        expect(swap.status).to.be.a('string').that.equals('seeker.invoice.sent')
        expect(swap.secretHash).to.be.a('string').that.equals(secretHash)
      })
      .on('swap.holder.invoice.paid', swap => {
        expect(prevState.bob).to.equal('seeker.invoice.sent', 'bob')

        validate('bob', swap)
        expect(swap.status).to.be.a('string').that.equals('holder.invoice.paid')
        expect(swap.secretHash).to.be.a('string').that.equals(secretHash)
      })
      .on('swap.seeker.invoice.paid', swap => {
        expect(prevState.bob).to.equal('holder.invoice.paid', 'bob')

        validate('bob', swap)
        expect(swap.status).to.be.a('string').that.equals('seeker.invoice.paid')
        expect(swap.secretHash).to.be.a('string').that.equals(secretHash)
      })
      .on('swap.holder.invoice.settled', swap => {
        expect(prevState.bob).to.equal('seeker.invoice.paid', 'bob')

        validate('bob', swap)
        expect(swap.status).to.be.a('string').that.equals('seeker.invoice.settled')
        expect(swap.secretHash).to.be.a('string').that.equals(secretHash)
      })
      .on('swap.seeker.invoice.settled', swap => {
        expect(prevState.bob).to.equal('seeker.invoice.paid', 'bob')

        validate('bob', swap)
        expect(swap.status).to.be.a('string').that.equals('seeker.invoice.settled')
        expect(swap.secretHash).to.be.a('string').that.equals(secretHash)
      })
  })

  /**
   * Alice places an order using the secret hash. The test waits for the order
   * to be opened on the orderbook.
   */
  it('must allow Alice to place an order', function (done) {
    this.test.ctx.alice
      .once('order.created', order => {
        expect(order).to.be.an('object')
        expect(order.id).to.be.a('string')
        expect(order.ts).to.be.a('number')
        expect(order.uid).to.be.a('string').that.equals('alice')
        expect(order.type).to.be.a('string').that.equals('limit')
        expect(order.side).to.be.a('string').that.equals('ask')
        expect(order.baseAsset).to.be.a('string').that.equals('BTC')
        expect(order.baseQuantity).to.be.a('number').that.equals(10000)
        expect(order.baseNetwork).to.be.a('string').that.equals('lightning.btc')
        expect(order.quoteAsset).to.be.a('string').that.equals('ETH')
        expect(order.quoteQuantity).to.be.a('number').that.equals(100000)
        expect(order.quoteNetwork).to.be.a('string').that.equals('ethereum')
        expect(order.status).to.be.a('string').that.equals('created')
      })
      .once('order.opened', order => {
        expect(order).to.be.an('object')
        expect(order.id).to.be.a('string')
        expect(order.ts).to.be.a('number')
        expect(order.uid).to.be.a('string').that.equals('alice')
        expect(order.type).to.be.a('string').that.equals('limit')
        expect(order.side).to.be.a('string').that.equals('ask')
        expect(order.baseAsset).to.be.a('string').that.equals('BTC')
        expect(order.baseQuantity).to.be.a('number').that.equals(10000)
        expect(order.baseNetwork).to.be.a('string').that.equals('lightning.btc')
        expect(order.quoteAsset).to.be.a('string').that.equals('ETH')
        expect(order.quoteQuantity).to.be.a('number').that.equals(100000)
        expect(order.quoteNetwork).to.be.a('string').that.equals('ethereum')
        expect(order.status).to.be.a('string').that.equals('opened')

        done()
      })
      .once('order.closed', order => done(Error('order unexpected closed!')))
      .submitLimitOrder(Object.assign({}, ORDER_PROPS, { side: 'ask' }))
      .catch(done)
  })

  /**
   * Bob places the counter-order that would match with Alice's order, and waits
   * for the order to be opened on the orderbook.
   */
  it('must allow Bob to place an order', function (done) {
    this.test.ctx.bob
      .once('order.created', order => {
        expect(order).to.be.an('object')
        expect(order.id).to.be.a('string')
        expect(order.ts).to.be.a('number')
        expect(order.uid).to.be.a('string').that.equals('bob')
        expect(order.type).to.be.a('string').that.equals('limit')
        expect(order.side).to.be.a('string').that.equals('bid')
        expect(order.baseAsset).to.be.a('string').that.equals('BTC')
        expect(order.baseQuantity).to.be.a('number').that.equals(10000)
        expect(order.baseNetwork).to.be.a('string').that.equals('lightning.btc')
        expect(order.quoteAsset).to.be.a('string').that.equals('ETH')
        expect(order.quoteQuantity).to.be.a('number').that.equals(100000)
        expect(order.quoteNetwork).to.be.a('string').that.equals('ethereum')
        expect(order.status).to.be.a('string').that.equals('created')
      })
      .once('order.opened', order => {
        expect(order).to.be.an('object')
        expect(order.id).to.be.a('string')
        expect(order.ts).to.be.a('number')
        expect(order.uid).to.be.a('string').that.equals('bob')
        expect(order.type).to.be.a('string').that.equals('limit')
        expect(order.side).to.be.a('string').that.equals('bid')
        expect(order.baseAsset).to.be.a('string').that.equals('BTC')
        expect(order.baseQuantity).to.be.a('number').that.equals(10000)
        expect(order.baseNetwork).to.be.a('string').that.equals('lightning.btc')
        expect(order.quoteAsset).to.be.a('string').that.equals('ETH')
        expect(order.quoteQuantity).to.be.a('number').that.equals(100000)
        expect(order.quoteNetwork).to.be.a('string').that.equals('ethereum')
        expect(order.status).to.be.a('string').that.equals('opened')

        done()
      })
      .once('order.closed', order => done(Error('order unexpected closed!')))
      .submitLimitOrder(Object.assign({}, ORDER_PROPS, { side: 'bid' }))
      .catch(done)
  })

  it('must complete the atomic swap', function (done) {
    const timeout = this.timeout() - 1000
    const timeStart = Date.now()
    const timer = setInterval(function () {
      const { alice, bob } = prevState
      const duration = Date.now() - timeStart

      if (duration > timeout) {
        clearInterval(timer)
        done(Error(`timed out! alice: ${alice}, bob: ${bob}`))
        return
      }
      if (alice !== 'holder.invoice.settled') return
      if (bob !== 'seeker.invoice.settled') return

      clearInterval(timer)
      done()
    }, 100)
  })
})
