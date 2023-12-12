/**
 * @file Behavioral specification for the Ethereum network
 */

const Blockchains = require('../../../lib/blockchains')
const Ethereum = require('../../../lib/blockchains/ethereum')
const Lightning = require('../../../lib/blockchains/lightning')
const config = require('../../../etc/config.dev')

before('setup test environment', function () {
  this.sdk = {}
  this.config = {}

  const USERS = ['alice', 'bob']
  for (const id of USERS) {
    const { blockchains } = config
    const creds = require(`../../../../portal/test/unit/${id}`)

    this.config[id] = Object.assign({ id }, config, {
      blockchains: Object.assign({}, blockchains, {
        ethereum: Object.assign({}, blockchains.ethereum, creds.ethereum),
        lightning: Object.assign({}, blockchains.lightning, creds.lightning)
      })
    })
  }
})

after('teardown test environment', function () {
  this.test.ctx.sdk = null
  this.test.ctx.config = null
})

describe('Blockchains', function () {
  describe('supperted', function () {
    require('./ethereum')
    require('./lightning')
  })

  let instance = null

  describe('instantiation', function () {
    it('must throw when instantiated without required arguments', function () {
      expect(() => { instance = new Blockchains() }).to.throw()
    })

    it('must not throw when instantiated with required arguments', function () {
      const createInstance = () => {
        const { sdk, config } = this.test.ctx
        instance = new Blockchains(sdk, config.alice.blockchains)
      }

      expect(createInstance).to.not.throw()
      expect(instance).to.be.an.instanceof(Blockchains)
      expect(instance.ethereum).to.be.an.instanceof(Ethereum)
      expect(instance.lightning).to.be.an.instanceof(Lightning)
    })
  })

  describe('operation', function () {
    before('construct instance', function () {
      const { sdk, config } = this.test.ctx
      instance = new Blockchains(sdk, config.alice.blockchains)
    })

    it('must correctly connect to the blockchains', function () {
      const validate = blockchains => {
        expect(blockchains).to.be.an.instanceof(Array)
        expect(blockchains).to.have.length(2)
        expect(blockchains[0]).to.be.an.instanceof(Ethereum)
        expect(blockchains[1]).to.be.an.instanceof(Lightning)
      }

      return instance
        .once('connect', validate)
        .connect()
        .then(validate)
    })

    it('must correctly disconnect from the blockchains', function () {
      const validate = blockchains => {
        expect(blockchains).to.be.an.instanceof(Array)
        expect(blockchains).to.have.length(2)
        expect(blockchains[0]).to.be.an.instanceof(Ethereum)
        expect(blockchains[1]).to.be.an.instanceof(Lightning)
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
    before('construct instance', function () {
      const { sdk, config } = this.test.ctx
      instance = new Blockchains(sdk, config.blockchains)
    })

    after('destroy instance', function () {
      instance = null
    })
  })
})
