/**
 * @file Behavioral specification for the Ethereum network
 */

const Blockchain = require('../../../lib/blockchains/ethereum')
const config = require('../../../etc/config.dev')
const { createHash, randomBytes } = require('crypto')

describe('Ethereum', function () {
  const id = 'alice'
  const { blockchains } = config
  const creds = require(`../../../../portal/test/unit/${id}`)
  const CONFIG = Object.assign({ id }, config, {
    blockchains: Object.assign({}, blockchains, {
      ethereum: Object.assign({}, blockchains.ethereum, creds.ethereum),
      lightning: Object.assign({}, blockchains.lightning, creds.lightning)
    })
  })
  const SDK = {}
  const PROPS = CONFIG.blockchains.ethereum

  /**
   * A map of regular expressions to match
   * @type {RegExp}
   */
  const REG_EXPS = {
    ADDRESS: /^0x[a-fA-F0-9]{40}$/,
    HASH: /^0x[a-fA-F0-9]{64}$/
  }

  let instance = null

  describe('instantiation', function () {
    it('must throw when instantiated without required arguments', function () {
      expect(() => { instance = new Blockchain() }).to.throw()
    })

    it('must not throw when instantiated with required arguments', function () {
      const createInstance = () => {
        instance = new Blockchain(SDK, PROPS)
      }

      expect(createInstance).to.not.throw()
      expect(instance).to.be.an.instanceof(Blockchain)
      expect(instance.id).to.be.a('string').that.equals('ethereum')
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
      instance = new Blockchain(SDK, PROPS)
    })

    it('must correctly connect to the blockchain', function () {
      const validate = blockchain => {
        expect(blockchain).to.be.an.instanceof(Blockchain)
        expect(blockchain.id).to.be.a('string').that.equals('ethereum')

        const json = blockchain.toJSON()
        expect(json['@type']).to.be.a('string').that.equals('Ethereum')

        const { id, wallet, contract } = json
        expect(id).to.be.a('string').that.equals('ethereum')
        expect(wallet).to.be.a('string').that.matches(REG_EXPS.ADDRESS)
        expect(contract).to.be.a('object')
        expect(contract.address).to.be.a('string').that.matches(REG_EXPS.ADDRESS)
      }

      return instance
        .once('connect', validate)
        .connect()
        .then(validate)
    })

    it('must create an invoice', async function () {
      const invoice = PARTY.invoice = await instance.createInvoice(PARTY)

      expect(invoice).to.be.an('object')
      expect(invoice.blockHash).to.be.a('string').that.matches(REG_EXPS.HASH)
      expect(invoice.from).to.be.a('string').that.matches(REG_EXPS.ADDRESS)
      expect(invoice.to).to.be.a('string').that.matches(REG_EXPS.ADDRESS)
      expect(invoice.transactionHash).to.be.a('string').that.matches(REG_EXPS.HASH)
    })

    it('must pay an invoice', async function () {
      const receipt = PARTY.receipt = await instance.payInvoice(PARTY)
      expect(receipt).to.equal(null)
    })

    it('must settle an invoice', async function () {
      const receipt = PARTY.receipt = await instance.settleInvoice(PARTY, SECRET.toString('hex'))
      expect(receipt).to.equal(null)
    })

    it('must correctly disconnect from the blockchain', function () {
      const validate = blockchain => {
        expect(blockchain).to.be.an.instanceof(Blockchain)
        expect(blockchain.id).to.be.a('string').that.equals('ethereum')

        const json = blockchain.toJSON()
        expect(json['@type']).to.be.a('string').that.equals('Ethereum')
        expect(json.id).to.be.a('string').that.equals('ethereum')
        expect(json.wallet).to.be.a('string').that.matches(/^0x[a-fA-F0-9]{40}$/)
        expect(json.contract).to.be.a('object')
        expect(json.contract.address).to.be.a('string').that.matches(/^0x[a-fA-F0-9]{40}$/)
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
