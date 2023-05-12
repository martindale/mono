/**
 * @file Behavioral specification for interface to supported assets
 */

const { expect } = require('chai')
const Assets = require('../../../lib/core/assets')

const SUPPORTED = [
  'BTC',
  'ETH'
]

describe('Assets', function () {
  describe('Supported Assets', function () {
    for (const assetName of SUPPORTED) {
      it(`must support the ${assetName} asset`, function () {
        expect(Assets).to.have.any.keys(assetName)

        const asset = Assets[assetName]
        expect(asset).to.be.an('object')
      })
    }
  })
})
