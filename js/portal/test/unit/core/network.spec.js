/**
 * @file Behavioral specification for a Network
 */

const { expect } = require('chai')
const Network = require('../../../lib/core/network')

describe('Network', function () {
  describe('Instantiation', function () {
    it('must throw when instantiated', function () {
      expect(() => new Network()).to.throw()
      expect(() => new Network({})).to.throw()
      expect(() => new Network({ client: {} })).to.throw()
    })
  })
})
