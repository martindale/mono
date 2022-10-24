/**
 * @file HTTP handler used to manage limit orders
 */

const HTTP_METHODS = module.exports

/**
 * Submits a new limit order for addition into the Orderbook
 * @param {HttpRequest} req The incoming HTTP request
 * @param {HttpResponse} res The outgoing HTTP response
 * @param {HttpContext} ctx The HTTP request context
 * @returns {Void}
 */
HTTP_METHODS.PUT = function (req, res, ctx) {
  if (req.json == null) {
    return res.send(new Error('no order specified!'))
  }

  let orderbook

  try {
    orderbook = ctx.orderbooks.get(req.json)
  } catch (err) {
    return res.send(err)
  }

  orderbook.add(Object.assign({}, req.json, { type: 'limit' }))
    .then(order => res.send(order))
    .catch(err => res.send(err))
}

/**
 * Deletes an existing limit order from the Orderbook
 * @param {IncomingMessage} req The incoming HTTP request
 * @param {ServerResponse} res The outgoing HTTP response
 * @param {HttpContext} ctx The HTTP request context
 * @returns {Void}
 */
HTTP_METHODS.DELETE = function (req, res, ctx) {
  if (req.json == null) {
    return res.send(new Error('no order specified!'))
  }

  let orderbook

  try {
    orderbook = ctx.orderbooks.get(req.json)
  } catch (err) {
    return res.send(err)
  }

  orderbook.delete(req.json)
    .then(order => res.send(order))
    .catch(err => res.send(err))
}
