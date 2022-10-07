/**
 * @file Manages the order book
 */

/**
 * Export the handlers for the supported HTTP methods
 * @type {Object}
 */
const METHODS = module.exports

/**
 * Creates a new order in the order book
 * @param {IncomingMessage} req The incoming HTTP request
 * @param {ServerResponse} res The outgoing HTTP response
 * @param {Object} ctx Context object that exposes injected dependencies
 * @returns {Void}
 */
METHODS.PUT = function (req, res, ctx) {
  throw new Error('not implemented yet')
}

/**
 * Retrieves an order from the order book
 * @param {IncomingMessage} req The incoming HTTP request
 * @param {ServerResponse} res The outgoing HTTP response
 * @param {Object} ctx Context object that exposes injected dependencies
 * @returns {Void}
 */
METHODS.GET = function (req, res, ctx) {
  throw new Error('not implemented yet')
}

/**
 * Cancels an order in the order book
 * @param {IncomingMessage} req The incoming HTTP request
 * @param {ServerResponse} res The outgoing HTTP response
 * @param {Object} ctx Context object that exposes injected dependencies
 * @returns {Void}
 */
METHODS.DELETE = function (req, res, ctx) {
  throw new Error('not implemented yet')
}

/**
 * Watches the order book for changes
 * @param {IncomingMessage} req The incoming HTTP request
 * @param {ServerResponse} res The outgoing HTTP response
 * @param {Object} ctx Context object that exposes injected dependencies
 * @returns {Void}
 */
METHODS.UPGRADE = function (req, res, ctx) {
  throw new Error('not implemented yet')
}
