/**
 * @fle Behavioral specification for a Asset
 */

const { expect } = require('chai')
const Asset = require('../../lib/core/asset')

describe('Asset', function () {
  describe('Instantiation', function () {
    it('must throw when instantiated without required arguments', function () {
      expect(() => new Asset()).to.throw()
      expect(() => new Asset({ name: 'asset' })).to.throw()
      expect(() => new Asset({ symbol: 'ASSET' })).to.throw()
    })

    it('must instantiate correctly with required arguments', function () {
      expect(() => new Asset({ name: 'asset', symbol: 'ASSET' })).to.not.throw()
    })
  })
})
