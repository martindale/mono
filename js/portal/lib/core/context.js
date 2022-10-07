/**
 * @file Request Context
 */

const Store = require('./store')

/**
 * Export an object that exposes the injected dependencies
 * @type {Object}
 */
module.exports = {
  log: console,
  store: new Store({ path: process.env.PORTAL_STORE_PATH })
}
