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
 * Returns random data of the specified length (in bytes)
 * @param {Number} [length=32] The number of bytes of random data to generate
 * @returns {*}
 */
Helpers.random = function (length = 32) {
  return crypto.randomBytes(length)
}

/**
 * Returns hex-formatted sha256 hash of the provided input
 * @param {String} data The data whose hash is to be calculated
 * @returns {String}
 */
Helpers.hash = function (data) {
  return crypto.createHash('sha256')
    .update(data)
    .digest('hex')
}

/**
 * Returns a universally-unique identifier, without any hyphens
 * @returns {String}
 */
Helpers.uuid = function () {
  return uuid.v4().replace(/-/g, '')
}
