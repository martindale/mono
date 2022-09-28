const Swap = artifacts.require('Swap')

/**
 * Deploys the Swap smart contract
 * @param {Deployer} deployer The truffle smart contract deployer
 * @returns {Void}
 */
module.exports = function (deployer) {
  deployer.deploy(Swap)
}
