/**
 * @file HTTP handler that tests various HTTP methods
 */

const METHODS = module.exports

/**
 * Echoes the request's JSON contents back to the client
 * @param {IncomingMessage} req The incoming HTTP request
 * @param {ServerResponse} res The outgoing HTTP response
 * @param {Object} ctx Context object that exposes injected dependencies
 * @returns {Void}
 */
METHODS.GET = function (req, res, ctx) {
  const data = JSON.stringify({ method: 'GET', json: req.json })
  res.setHeader('content-type', 'application/json')
  res.setHeader('content-length', Buffer.byteLength(data))
  res.setHeader('content-encoding', 'identity')
  res.end(data)
}

/**
 * Echoes the request's JSON contents back to the client
 * @param {IncomingMessage} req The incoming HTTP request
 * @param {ServerResponse} res The outgoing HTTP response
 * @param {Object} ctx Context object that exposes injected dependencies
 * @returns {Void}
 */
METHODS.POST = function (req, res, ctx) {
  const data = JSON.stringify({ method: 'POST', json: req.json })
  res.setHeader('content-type', 'application/json')
  res.setHeader('content-length', Buffer.byteLength(data))
  res.setHeader('content-encoding', 'identity')
  res.end(data)
}
