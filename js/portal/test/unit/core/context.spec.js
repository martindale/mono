/**
 * @fle Behavioral specification for a Asset
 */

const { expect } = require('chai')
const ctx = require('../../../lib/core/context')
const Networks = require('../../../lib/core/networks')
const Orderbooks = require('../../../lib/core/orderbooks')

describe('HttpContext', function () {
  it('must expose an interface to all supported networks', function () {
    expect(ctx.networks).to.be.an.instanceof(Networks)
  })

  it('must expose an interface to all supported assets', function () {
    expect(ctx.assets).to.be.an.instanceof(Map)
  })

  it('must expose an interface to all supported orderbooks', function () {
    expect(ctx.orderbooks).to.be.an.instanceof(Orderbooks)
  })
})
