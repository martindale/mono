/**
 * @file HTTP handler used to manage atomic swaps
 */
const Order = require("../../../core/order");
const { createHash, randomBytes } = require('crypto')

const HTTP_METHODS = module.exports

/**
 * Creates directly a swap with orders (for UI testing purposes)
 * @param {HttpRequest} req The incoming HTTP request
 * @param {HttpResponse} res The outgoing HTTP response
 * @param {HttpContext} ctx The HTTP request context
 * @returns {Object}
 */
HTTP_METHODS.POST = function swapCreate (req, res, ctx) {

  const randomSecret = () => randomBytes(32)
  const sha256 = buffer => createHash('sha256').update(buffer).digest('hex')
  const secret = randomSecret()
  const swapHash = sha256(secret)
  const swapSecret = secret.toString('hex')

  const makerOrderProps = Object.assign(req.json.makerOrderProps, {hash: swapHash})
  const takerOrderProps = Object.assign(req.json.takerOrderProps, {hash: swapHash})
  const makerOrder = new Order(makerOrderProps)
  const takerOrder = new Order(takerOrderProps)



  ctx.swaps.fromOrders(makerOrder, takerOrder)
      .then(swap => res.send({swap: swap, swapSecret: swapSecret}))
      .catch(err => res.send(err))
}