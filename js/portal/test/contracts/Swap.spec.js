/**
 * @file Specification for the Swap smart contract
 */

const { expect } = require('chai')
const { createHash, randomBytes } = require('crypto')

describe('Swap', function () {
  let Contract = null
  let contract = null

  beforeEach(async function () {
    const { contracts } = this
    Contract = await contracts.Swap.deploy()
    contract = Contract.methods
  })

  describe('.toHash()', function () {
    it('must correctly generate a SHA-256 hash', async function () {
      const secret = randomBytes(32)
      const secretHash = createHash('sha256').update(secret).digest('hex')
      const hash = await contract.toHash(secret).call()

      expect(hash).to.equal(`0x${secretHash}`)
    })
  })

  describe('Native ETH', async function () {
    describe('Happy-path', function () {
      it('must create an invoice')
      it('must pay an invoice')
      it('must settle an invoice')
    })

    describe('Error-handling', function () {
      it('needs more test cases')
    })

    describe('Pathological cases', function () {
      it('needs more test cases')
    })
  })

  describe('ERC-20 Tokens', function () {
    describe('Happy-path', function () {
      it('must create an invoice')
      it('must pay an invoice')
      it('must settle an invoice')
    })

    describe('Error-handling', function () {
      it('needs more test cases')
    })

    describe('Pathological cases', function () {
      it('needs more test cases')
    })
  })
})
