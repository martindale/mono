/**
 * @file HTTP handler that echo's the contents back to the client
 */

/**
 * Echoes the request's JSON contents back to the client
 * @param {HttpRequest} req The incoming HTTP request
 * @param {HttpResponse} res The outgoing HTTP response
 * @param {HttpContext} ctx The HTTP request context
 * @returns {Void}
 */
module.exports = function (req, res, ctx) {
  if (req.json == null) {
    res.send(new Error('no JSON data to sent!'))
  } else {
    res.send(req.json)
  }
}
