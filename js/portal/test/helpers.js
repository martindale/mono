/**
 * @file Helper functions
 */

const { readdirSync, readFileSync } = require('fs')
const { basename, extname, resolve, join } = require('path')
const Solc = require('solc')

/**
 * Export the helper functions
 * @type {Object}
 */
const Helpers = module.exports

/**
 * Paths to various locations
 * @type {Object}
 */
Helpers.PATHS = {
  contracts: resolve(__dirname, '..', 'contracts')
}

/**
 * Contracts that must be deployed
 * @type {Array}
 */
Helpers.CONTRACTS = ['Swap']

/**
 * Compiles the contracts
 * @returns {Promise<Object>}
 */
Helpers.compile = function () {
  return new Promise((resolve, reject) => {
    const input = {
      language: 'Solidity',
      sources: readdirSync(Helpers.PATHS.contracts)
        .filter(file => extname(file) === '.sol')
        .map(file => join(Helpers.PATHS.contracts, file))
        .reduce((sources, file) => {
          sources[basename(file)] = { content: readFileSync(file, 'utf-8') }
          return sources
        }, {}),
      settings: { outputSelection: { '*': { '*': ['*'] } } }
    }
    const output = JSON.parse(Solc.compile(JSON.stringify(input)))
    const message = (output.errors || [])
      .filter(err => err.severity === 'error')
      .map(err => err.formattedMessage)
      .join('\n')

    message.length
      ? reject(Error(message))
      : resolve(output.contracts)
  })
}

/**
 * Deploy the specified contract
 * @param {Object} contracts The contracts to deploy; returned by .compile()
 * @param {Web3} web3 The web3 instance used to deploy the contract
 * @returns {Promise<Contract>}
 */
Helpers.deploy = async function (contracts, web3) {
  const accounts = await web3.eth.getAccounts()
  const deployed = {}

  for (const name in contracts) {
    const contractName = basename(name, extname(name, '.sol'))
    if (!Helpers.CONTRACTS.includes(contractName)) continue

    const compiled = contracts[name][contractName]
    const contract = new web3.eth.Contract(compiled.abi)
    const transaction = await contract
      .deploy({ data: compiled.evm.bytecode.object })
      .send({ from: accounts[0] })

    deployed[contractName] = {
      abi: compiled.abi,
      address: transaction._address
    }
  }

  return deployed
}
