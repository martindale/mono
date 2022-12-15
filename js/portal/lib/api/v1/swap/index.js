/**
 * @file HTTP handler used to manage atomic swaps
 */
const Order = require("../../../core/order");

const HTTP_METHODS = module.exports

/**
 * Creates a swap based on an order match
 * @param {HttpRequest} req The incoming HTTP request
 * @param {HttpResponse} res The outgoing HTTP response
 * @param {HttpContext} ctx The HTTP request context
 * @returns {Void}
 */
HTTP_METHODS.PUT = function swapOpen (req, res, ctx) {
  const swap = req.json.swap
  // const party = Object.assign(req.json.party, { id: req.uid })
  const party = req.json.party
  ctx.swaps.open(swap, party)
    .then(swap => res.send(swap))
    .catch(err => res.send(err))
}

/**
 * Commits to a swap in progress
 * @param {HttpRequest} req The incoming HTTP request
 * @param {HttpResponse} res The outgoing HTTP response
 * @param {HttpContext} ctx The HTTP request context
 * @returns {Void}
 */
HTTP_METHODS.POST = function swapCommit (req, res, ctx) {
  const swap = req.json.swap
  const party = req.json.party
  // const party = Object.assign(req.json.party, { id: req.uid })
  ctx.swaps.commit(swap, party)
    .then(swap => res.send(swap))
    .catch(err => res.send(err))
}

/**
 * Aborts a swap in progress
 * @param {HttpRequest} req The incoming HTTP request
 * @param {HttpResponse} res The outgoing HTTP response
 * @param {HttpContext} ctx The HTTP request context
 * @returns {Void}
 */
HTTP_METHODS.DELETE = function swapAbort (req, res, ctx) {
  let data

  try {
    ctx.swaps.abort(req.json, { id: req.uid })
  } catch (err) {
    data = err
  } finally {
    res.send(data)
  }
}
