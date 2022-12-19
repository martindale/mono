/**
 * @file Helper functions
 */

const crypto = require('crypto')
const uuid = require('uuid')

/**
 * Export the helper functions
 * @type {Object}
 */
const Helpers = module.exports

/**
 * Returns hex-formatted sha256 hash of the concatenation of all input strings
 * @param {String[]} args
 * @returns {String}
 */
Helpers.hash = function (...args) {
  return crypto.createHash('sha256')
    .update(args.join(''))
    .digest('hex')
}

/**
 * Returns a universally-unique identifier, without any hyphens
 * @returns {String}
 */
Helpers.uuid = function () {
  return uuid.v4().replace(/-/g, '')
}
