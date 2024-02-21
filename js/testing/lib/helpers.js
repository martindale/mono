/**
 * @file Helper functions
 */

const { readdirSync, readFileSync } = require('fs')
const keythereum = require('keythereum')
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
  contracts: resolve(__dirname, '..', '..', 'portal', 'contracts')
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

/**
 * Generates a configuration object for the specified user
 * @param {String} id The unique identifier of the user
 * @param {Object} config The default configuration object
 * @returns {Object}
 */
Helpers.generate = function (id, config) {
  const pathRoot = process.env.PORTAL_ROOT

  const pathGeth = join(pathRoot, 'playnet', 'state', id, 'geth')
  const pathGethKeystore = join(pathGeth, 'keystore.json')
  const gethKeystore = JSON.parse(readFileSync(pathGethKeystore))

  const pathLnd = join(pathRoot, 'playnet', 'state', id, 'lnd')
  const pathLndConfig = join(pathRoot, 'playnet', `lnd.${id}.conf`)
  const pathLndMacaroons = join(pathLnd, 'data', 'chain', 'bitcoin', 'regtest')
  const lndMacaroonAdmin = readFileSync(join(pathLndMacaroons, 'admin.macaroon'))
  const lndMacaroonInvoice = readFileSync(join(pathLndMacaroons, 'invoice.macaroon'))
  const lndConfig = readFileSync(pathLndConfig).toString('utf8')
    /* eslint-disable no-multi-spaces */
    .split('\n')                  // Split on new-lines
    .filter(line => !!line)       // Filter out empty lines
    .map(line => line.split('=')) // Split the line into key-value pairs
    .reduce((conf, [k, v]) => {   // Reduce the key-value pairs into an object
      if (v === 'true' || v === 'false') {
        conf[k] = Boolean(v)
      } else if (!isNaN(+v)) {
        conf[k] = +v
      } else {
        conf[k] = v
      }

      return conf
    }, {})
    /* eslint-enable no-multi-spaces */

  return merge({}, config, {
    id,
    blockchains: {
      ethereum: {
        public: `0x${gethKeystore.address}`,
        private: `0x${keythereum.recover(id, gethKeystore).toString('hex')}`
      },
      lightning: {
        hostname: lndConfig.restlisten.split(':')[0],
        port: Number(lndConfig.restlisten.split(':')[1]),
        cert: readFileSync(join(pathLnd, 'tls.cert')).toString('hex'),
        admin: lndMacaroonAdmin.toString('hex'),
        invoice: lndMacaroonInvoice.toString('hex')
      }
    }
  })
}
/**
 * Checks whether the specified item is an object (excluding an Array)
 * @param item The item to check
 * @returns {boolean}
 */
function isObject (item) {
  return (item && typeof item === 'object' && !Array.isArray(item))
}

/**
 * Deep merge two or more objects
 * @param target The target object
 * @param ...sources The source objects
 */
function merge (target, ...sources) {
  if (!sources.length) return target
  const source = sources.shift()

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} })
        merge(target[key], source[key])
      } else {
        Object.assign(target, { [key]: source[key] })
      }
    }
  }

  return merge(target, ...sources)
}
