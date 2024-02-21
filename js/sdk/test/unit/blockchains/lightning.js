/**
 * @file Behavioral specification for the Lightning network
 */

const Blockchain = require('../../../lib/blockchains/lightning')
const { createHash, randomBytes } = require('crypto')

describe('Lightning', function () {
  let instance = null

  describe('instantiation', function () {
    it('must throw when instantiated without required arguments', function () {
      expect(() => { instance = new Blockchain() }).to.throw()
    })

    it('must not throw when instantiated with required arguments', function () {
      const createInstance = () => {
        const { sdk, config: { alice } } = this.test.ctx
        instance = new Blockchain(sdk, alice.blockchains.lightning)
      }

      expect(createInstance).to.not.throw()
      expect(instance).to.be.an.instanceof(Blockchain)
      expect(instance.id).to.be.a('string').that.equals('lightning')
    })
  })

  describe('operation', function () {
    const SECRET = randomBytes(32)
    const SECRET_HASH = createHash('sha256').update(SECRET).digest('hex')
    const PARTY = {
      swap: {
        id: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        secretHash: SECRET_HASH
      },
      quantity: 1000,
      invoice: null,
      receipt: null
    }

    before('construct instance', function () {
      const { sdk, config: { alice } } = this.test.ctx
      instance = new Blockchain(sdk, alice.blockchains.lightning)
    })

    it('must correctly connect to the blockchain', function () {
      const validate = blockchain => {
        expect(blockchain).to.be.an.instanceof(Blockchain)
        expect(blockchain.id).to.be.a('string').that.equals('lightning')
        expect(blockchain.hostname).to.be.a('string').that.equals('127.0.0.1')
        expect(blockchain.port).to.be.a('number').that.equals(11001)
        expect(blockchain.publicKey).to.be.a('string').that.matches(/^[0-9a-f]{66}$/)

        const json = blockchain.toJSON()
        expect(json['@type']).to.be.a('string').that.equals('Lightning')
        expect(json.id).to.be.a('string').that.equals('lightning')
        expect(json.hostname).to.be.a('string').that.equals('127.0.0.1')
        expect(json.port).to.be.a('number').that.equals(11001)
        expect(json.publicKey).to.be.a('string').that.matches(/^[0-9a-f]{66}$/)
      }

      return instance
        .once('connect', validate)
        .connect()
        .then(validate)
    })

    it('must create an invoice', async function () {
      const invoice = PARTY.invoice = await instance.createInvoice(PARTY)

      expect(invoice).to.be.an('object')
      expect(invoice.id).to.be.a('string').that.equals(SECRET_HASH)
      expect(invoice.request).to.be.a('string').that.matches(/^lnbcrt\w{356}/)
      expect(invoice.amount).to.be.a('number').that.equals(PARTY.quantity)
    })

    it('must pay an invoice', async function () {
      const { sdk, config: { bob } } = this.test.ctx
      const instance = new Blockchain(sdk, bob.blockchains.lightning)
      const receipt = PARTY.receipt = await instance.payInvoice(PARTY)

      expect(receipt).to.be.an('object')
      expect(receipt.id).to.be.a('string').that.equals(SECRET_HASH)
      expect(receipt.request).to.be.a('string').that.matches(/^lnbcrt\w{356}/)
      expect(receipt.amount).to.be.a('number').that.equals(PARTY.quantity)
    })

    it('waiting for lnd to propagate the created invoice', function (done) {
      setTimeout(done, 1000)
    })

    it('must settle an invoice', async function () {
      const receipt = PARTY.receipt = await instance.settleInvoice(PARTY, SECRET)
      expect(receipt).to.be.an('object')
    })

    it('must correctly disconnect from the blockchain', function () {
      const validate = blockchain => {
        expect(blockchain).to.be.an.instanceof(Blockchain)
        expect(blockchain.id).to.be.a('string').that.equals('lightning')
        expect(blockchain.hostname).to.be.a('string').that.equals('127.0.0.1')
        expect(blockchain.port).to.be.a('number').that.equals(11001)
        expect(blockchain.publicKey).to.be.a('string').that.matches(/^[0-9a-f]{66}$/)

        const json = blockchain.toJSON()
        expect(json['@type']).to.be.a('string').that.equals('Lightning')
        expect(json.id).to.be.a('string').that.equals('lightning')
        expect(json.hostname).to.be.a('string').that.equals('127.0.0.1')
        expect(json.port).to.be.a('number').that.equals(11001)
        expect(json.publicKey).to.be.a('string').that.matches(/^[0-9a-f]{66}$/)
      }

      return instance
        .once('disconnect', validate)
        .disconnect()
        .then(validate)
    })

    after('destroy instance', function () {
      instance = null
    })
  })

  describe('error-handling', function () {

  })
})
