/**
 * @file Handles a bidirectional websocket channel for each client
 */

const Swap = require('swap')

/**
 * Manages internal state
 * @type {Map}
 */
const SWAPS = new Map()

/**
 * Creates a swap based on an order match
 * @param {HttpRequest} req The incoming HTTP request
 * @param {HttpResponse} res The outgoing HTTP response
 * @param {HttpContext} ctx The HTTP request context
 * @returns {Void}
 */
module.exports.PUT = function (req, res, ctx) {
  let data

  try {
    data = new Swap(Object.assign({}, req.json, { uid: req.clientId }))
  } catch (err) {
    data = err
  } finally {
    res.send(data)
  }
}

/**
 * Exchanges the maker/taker swaps between the parties
 * @param {HttpRequest} req The incoming HTTP request
 * @param {HttpResponse} res The outgoing HTTP response
 * @param {HttpContext} ctx The HTTP request context
 * @returns {Void}
 */
module.exports.POST = function (req, res, ctx) {
  const party = req.json
  const { id } = party

  // if the counterparty data already exists, then exchange the data
  // if not, save the party data, and wait for the counterparty
  if (SWAPS.has(id)) {
    const counterParty = SWAPS.get(id)
    ctx.clients[party.uid].send(counterParty)
    ctx.clients[counterParty.uid].send(party)
    SWAPS.delete(id)
  } else {
    SWAPS.set(id, party)
  }

  res.end()
}
