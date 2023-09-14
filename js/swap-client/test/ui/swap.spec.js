/**
 * @file Performs a swap of two assets between alice and bob
 */

describe('Swap: BTC <-> ETH', function () {
  before('Log into the Portal DEX', async function () {
    const { alice, bob } = this.test.ctx
    await alice.login(1)
    await bob.login(2)
  })

  it('must submit an order for alice')

  it('must submit an order for bob')

  it('must correctly execute the atomic swap between alice and bob')

  after('Log out of the Portal DEX', async function () {
    const { alice, bob } = this.test.ctx
    await alice.logout()
    await bob.logout()
  })
})
