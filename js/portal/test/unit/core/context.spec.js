/**
 * @file Behavioral specification for a Asset
 */

const { expect } = require('chai')

describe('HttpContext', function () {
  it('must expose an interface to all supported orderbooks', function () {
    const ctx = require('../../../lib/core/context')
    const Orderbooks = require('../../../lib/core/orderbooks')
    expect(ctx.orderbooks).to.be.an.instanceof(Orderbooks)
  })
})
