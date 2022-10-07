/**
 * @file The HTTP API of the server
 */

const { readdirSync, statSync } = require('fs')
const { basename, dirname, extname, join, resolve } = require('path')

/**
 * Import the HTTP API at the specified path and expose it as an object
 * @param {String} [path] The HTTP API path
 * @returns {Object} The HTTP API object mapping endpoints to handlers
 */
module.exports = function (path) {
  return buildApi(path || resolve(join(__dirname, '..', 'api')))
}

/**
 * Builds a map of API endpoints
 *
 * Each endpoint maps to an object that holds one or more handlers. A handler is
 * a function or an object mapping HTTP methods to functions.
 * @example
 * {
 *   '/api/v1/orderbook': {
 *     PUT: function (req, res, ctx) { ... },
 *     GET: function (req, res, ctx) { ... },
 *     DELETE: function (req, res, ctx) { ... }
 *   },
 *   '/api/v1/marketdata': function (req, res, ctx) { ... }
 *   '/api/v1/btc': function (req, res, ctx) { ... }
 * }
 *
 * @param {String} path Path to the API directory
 * @returns {Object}
 */
function buildApi (path) {
  // Recursively read the specified path, generating an array of file paths:
  //
  // [
  //   ...
  //   '/fabriclabs/mono/js/portal/api/v1/bitcoin/index.js',
  //   '/fabriclabs/mono/js/portal/api/v1/ethereum/index.js',
  //   '/fabriclabs/mono/js/portal/api/v1/lightning/index.js',
  //   '/fabriclabs/mono/js/portal/api/v1/marketdata/index.js',
  //   '/fabriclabs/mono/js/portal/api/v1/orderbook/index.js',
  //   ...
  // ]
  //
  const paths = getEndpointPaths(path)
  const startIndex = dirname(path).length
  const endpoints = {}

  // `require` each of the paths, and map the imported function or map of HTTP
  // functions, to the endpoint, which would be rooted at the parent of the
  // specified path.
  for (const path of paths) {
    const subpath = path.substring(startIndex)
    const endpoint = basename(path) === 'index.js'
      ? dirname(subpath)
      : `${dirname(subpath)}/${basename(subpath, extname(subpath))}`
    const handler = require(path)

    endpoints[endpoint] = handler
  }

  return endpoints
}

/**
 * Recursively reads and returns all files in the specified directory
 * @param {String} dir The directory to traverse
 * @returns {String[]}
 * @todo Replace synchronous functions with async variants
 */
function getEndpointPaths (dir) {
  const dirs = []
  const files = []
  const paths = readdirSync(dir).map(file => join(dir, file))

  for (const path of paths) {
    const stat = statSync(path)
    if (stat.isDirectory()) {
      dirs.push(path)
    } else if (stat.isFile()) {
      files.push(path)
    }
  }

  for (const dir of dirs) {
    files.push(...getEndpointPaths(dir))
  }

  return files
}
