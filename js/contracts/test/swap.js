/**
 * @file Specification for the Swap smart contract
 */

const { expect } = require('chai')
const Swap = artifacts.require('Swap')

contract('Swap', function (accounts) {
  it('must have deployed the contract', async function () {
    const swap = await Swap.deployed()
    expect(swap).to.not.equal(null)
  })
})
