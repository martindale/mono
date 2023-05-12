/**
 * @file Behavioral specification for a Asset
 */

const { expect } = require('chai')

describe('HttpContext', function () {
  it('must expose an interface to all supported networks', function () {
    const ctx = require('../../../lib/core/context')
    const Networks = require('../../../lib/core/networks')
    expect(ctx.networks).to.be.an.instanceof(Networks)
  })

  it('must expose an interface to all supported assets', function () {
    const ctx = require('../../../lib/core/context')
    expect(ctx.assets).to.be.an('object')
  })

  it('must expose an interface to all supported orderbooks', function () {
    const ctx = require('../../../lib/core/context')
    const Orderbooks = require('../../../lib/core/orderbooks')
    expect(ctx.orderbooks).to.be.an.instanceof(Orderbooks)
  })
})
