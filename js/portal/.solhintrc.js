/**
 * @file Solidity linter configuration
 */

const packageJson = require('./package.json')

/**
 * Export the solhint configuration
 * @type {Object}
 */
module.exports = {
  extends: 'solhint:recommended',
  rules: {
    'compiler-version': ['error', packageJson.devDependencies.solc]
  }
}
