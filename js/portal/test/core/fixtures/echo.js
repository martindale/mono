/**
 * @file HTTP handler that echo's the contents back to the client
 */

/**
 * Echoes the request's JSON contents back to the client
 * @param {IncomingMessage} req The incoming HTTP request
 * @param {ServerResponse} res The outgoing HTTP response
 * @param {Object} ctx Context object that exposes injected dependencies
 * @returns {Void}
 */
module.exports = function (req, res, ctx) {
  const data = JSON.stringify(req.json)

  res.setHeader('content-type', 'application/json')
  res.setHeader('content-length', Buffer.byteLength(data))
  res.setHeader('content-encoding', 'identity')
  res.end(data)
}
