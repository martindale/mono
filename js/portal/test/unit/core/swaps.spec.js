/**
 * @file Behavioral specification for interface to in-progress atomic swaps
 */

const { expect } = require('chai')
const Context = require('../../../lib/core/context')
const Order = require('../../../lib/core/order')
const Party = require('../../../lib/core/party')
const Swap = require('../../../lib/core/swap')
const Swaps = require('../../../lib/core/swaps')

describe('Swaps', function () {
  /**
   * Tests instantiation behavior
   */
  describe('Instantiation', function () {
    it('must correctly instantiate', function () {
      let swaps = null

      expect(() => { swaps = new Swaps() }).to.not.throw()
      expect(swaps).to.be.an.instanceof(Swaps)
      expect(swaps.swaps).to.be.an.instanceof(Map).that.has.lengthOf(0)
      /* eslint-disable-next-line no-unused-expressions */
      expect(swaps).to.be.sealed
    })
  })

  /**
   * Regular operational behavior testing
   */
  describe('Operation', function () {
    const BASE_ORDER = {
      type: 'limit',
      baseAsset: 'ETH',
      baseNetwork: 'goerli',
      baseQuantity: 1,
      quoteAsset: 'USDC',
      quoteNetwork: 'sepolia',
      quoteQuantity: 1000
    }
    const makerOrderProps = Object.assign({
      uid: 'uid0',
      hash: 'maker',
      side: 'ask'
    }, BASE_ORDER)
    const takerOrderProps = Object.assign({
      uid: 'uid1',
      hash: 'taker',
      side: 'bid'
    }, BASE_ORDER)

    const makerOrder = new Order(makerOrderProps)
    const takerOrder = new Order(takerOrderProps)

    // const matchOrderHashes = [makerOrder.hash, takerOrder.hash]
    // const leader = Math.random() < 0.5 ? makerOrder : takerOrder
    // const follower = leader !== makerOrder ? makerOrder : takerOrder
    let swaps, swap

    /**
     * Create a fresh swaps instance at the start of the suite
     * @returns {Void}
     */
    before(function () { swaps = new Swaps(null, Context) })

    /**
     * Destroy the swaps instance at the end of the suite
     * @returns {Void}
     */
    after(function () { swaps = null })

    /**
     * Create a Swap from a pair of matched orders
     */
    it('must create a swap for an matched order pair', async function () {
      swap = await swaps.fromOrders(makerOrder, takerOrder)
      expect(swaps.swaps).to.have.lengthOf(1)
      expect(swaps.swaps.get(swap.id)).to.equal(swap)

      expect(swap).to.be.an.instanceof(Swap)
      expect(swap.id).to.be.a('string').with.lengthOf(64)
      expect(swap.secretHash).to.be.a('string').that.equals(makerOrder.hash)
      expect(swap.status).to.be.a('string').that.equals('created')

      expect(swap.secretHolder).to.be.an.instanceof(Party)
      /* eslint-disable-next-line no-unused-expressions */
      expect(swap.secretHolder).to.be.sealed
      expect(swap.secretHolder.id).to.be.a('string').that.equals('uid0')
      expect(swap.secretHolder.swap).to.be.an.instanceof(Swap).that.equals(swap)
      expect(swap.secretHolder.state).to.equal(null)
      expect(swap.secretHolder.isSecretHolder).to.be.a('boolean').that.equals(true)
      expect(swap.secretHolder.isSecretSeeker).to.be.a('boolean').that.equals(false)

      expect(swap.secretSeeker).to.be.an.instanceof(Party)
      /* eslint-disable-next-line no-unused-expressions */
      expect(swap.secretSeeker).to.be.sealed
      expect(swap.secretSeeker.id).to.be.a('string').that.equals('uid1')
      expect(swap.secretSeeker.swap).to.be.an.instanceof(Swap)
      expect(swap.secretSeeker.state).to.equal(null)
      expect(swap.secretSeeker.isSecretHolder).to.be.a('boolean').that.equals(false)
      expect(swap.secretSeeker.isSecretSeeker).to.be.a('boolean').that.equals(true)
    })

    /**
     * It must open the atomic swap for the secret holder
     */
    it('must open a swap for the secret holder', async function () {
      const STATE = { foo: 'bar' }
      const party = await swaps.open({ id: swap.id }, {
        id: swap.secretHolder.id,
        state: STATE
      })

      expect(swap).to.be.an.instanceof(Swap)
      expect(swap.id).to.be.a('string').with.lengthOf(64)
      expect(swap.secretHash).to.be.a('string').that.equals(makerOrder.hash)
      expect(swap.status).to.be.a('string').that.equals('opening')

      expect(swap.secretHolder).to.be.an.instanceof(Party)
      /* eslint-disable-next-line no-unused-expressions */
      expect(swap.secretHolder).to.be.sealed
      expect(swap.secretHolder.id).to.be.a('string').that.equals('uid0')
      expect(swap.secretHolder.swap).to.be.an.instanceof(Swap).that.equals(swap)
      expect(swap.secretHolder.state).to.be.an('object').that.deep.equals(STATE)
      expect(swap.secretHolder.isSecretHolder).to.be.a('boolean').that.equals(true)
      expect(swap.secretHolder.isSecretSeeker).to.be.a('boolean').that.equals(false)

      expect(swap.secretSeeker).to.be.an.instanceof(Party)
      /* eslint-disable-next-line no-unused-expressions */
      expect(swap.secretSeeker).to.be.sealed
      expect(swap.secretSeeker.id).to.be.a('string').that.equals('uid1')
      expect(swap.secretSeeker.swap).to.be.an.instanceof(Swap)
      expect(swap.secretSeeker.state).to.equal(null)
      expect(swap.secretSeeker.isSecretHolder).to.be.a('boolean').that.equals(false)
      expect(swap.secretSeeker.isSecretSeeker).to.be.a('boolean').that.equals(true)

      expect(party).to.be.an.instanceof(Party)
      /* eslint-disable-next-line no-unused-expressions */
      expect(party).to.be.sealed
      expect(party.id).to.be.a('string').that.equals('uid0')
      expect(party.swap).to.be.an.instanceof(Swap).that.equals(swap)
      expect(party.state).to.be.an('object').that.deep.equals(STATE)
      expect(party.isSecretHolder).to.be.a('boolean').that.equals(true)
      expect(party.isSecretSeeker).to.be.a('boolean').that.equals(false)
    })

    /**
     * It must open the atomic swap for the secret seeker
     */
    it('must open a swap for the secret seeker', async function () {
      const STATE = { bar: 'baz' }
      const party = await swaps.open({ id: swap.id }, {
        id: swap.secretSeeker.id,
        state: STATE
      })

      expect(swap).to.be.an.instanceof(Swap)
      expect(swap.id).to.be.a('string').with.lengthOf(64)
      expect(swap.secretHash).to.be.a('string').that.equals(makerOrder.hash)
      expect(swap.status).to.be.a('string').that.equals('opened')

      expect(swap.secretHolder).to.be.an.instanceof(Party)
      /* eslint-disable-next-line no-unused-expressions */
      expect(swap.secretHolder).to.be.sealed
      expect(swap.secretHolder.id).to.be.a('string').that.equals('uid0')
      expect(swap.secretHolder.swap).to.be.an.instanceof(Swap).that.equals(swap)
      expect(swap.secretHolder.state).to.be.an('object').that.deep.equals({ foo: 'bar' })
      expect(swap.secretHolder.isSecretHolder).to.be.a('boolean').that.equals(true)
      expect(swap.secretHolder.isSecretSeeker).to.be.a('boolean').that.equals(false)

      expect(swap.secretSeeker).to.be.an.instanceof(Party)
      /* eslint-disable-next-line no-unused-expressions */
      expect(swap.secretSeeker).to.be.sealed
      expect(swap.secretSeeker.id).to.be.a('string').that.equals('uid1')
      expect(swap.secretSeeker.swap).to.be.an.instanceof(Swap)
      expect(swap.secretSeeker.state).to.be.an('object').that.deep.equals(STATE)
      expect(swap.secretSeeker.isSecretHolder).to.be.a('boolean').that.equals(false)
      expect(swap.secretSeeker.isSecretSeeker).to.be.a('boolean').that.equals(true)

      expect(party).to.be.an.instanceof(Party)
      /* eslint-disable-next-line no-unused-expressions */
      expect(party).to.be.sealed
      expect(party.id).to.be.a('string').that.equals('uid1')
      expect(party.swap).to.be.an.instanceof(Swap).that.equals(swap)
      expect(party.state).to.be.an('object').that.deep.equals(STATE)
      expect(party.isSecretHolder).to.be.a('boolean').that.equals(false)
      expect(party.isSecretSeeker).to.be.a('boolean').that.equals(true)
    })

    it('must commit the swap for the secret holder')
    it('must commit the swap for the secret seeker')
  })
})
