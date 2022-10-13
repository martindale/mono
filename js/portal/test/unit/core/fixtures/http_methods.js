/**
 * @file HTTP handler that tests various HTTP methods
 */

const METHODS = module.exports

/**
 * Echoes the request's JSON contents back to the client
 * @param {HttpRequest} req The incoming HTTP request
 * @param {HttpResponse} res The outgoing HTTP response
 * @param {HttpContext} ctx The HTTP request context
 * @returns {Void}
 */
METHODS.GET = function (req, res, ctx) {
  res.send({ method: 'GET', json: req.json })
}

/**
 * Echoes the request's JSON contents back to the client
 * @param {IncomingMessage} req The incoming HTTP request
 * @param {ServerResponse} res The outgoing HTTP response
 * @param {Object} ctx Context object that exposes injected dependencies
 * @returns {Void}
 */
METHODS.POST = function (req, res, ctx) {
  res.send({ method: 'POST', json: req.json })
}
