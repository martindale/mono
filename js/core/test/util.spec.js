/**
 * @file Behavioral specification for utility functions
 */

const Util = require('../lib/util')
const { expect } = require('chai')
const { createHash } = require('crypto')

describe('Utility Functions', function () {
  describe('hash()', function () {
    it('must generate a 256-bit sha3 hash', function () {
      const arg = 'foo'
      const actual = Util.hash(arg)
      const expected = createHash('sha256').update(arg).digest('hex')
      expect(actual).to.equal(expected)
    })
  })

  describe('uuid()', function () {
    it('must generate a 32-character uuid', function () {
      const uuid = Util.uuid()
      expect(uuid).to.be.a('string')
      expect(uuid.length).to.equal(32)
      expect(uuid).to.match(/[a-z0-9]{32}/)
    })
  })
})
