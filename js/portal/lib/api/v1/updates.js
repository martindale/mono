/**
 * @file Handles a bidirectional websocket channel for each client
 */

/**
 * Handles a bidirectional websocket channel for each client
 * @param {Websocket} ws The underlying websocket
 * @param {HttpContext} ctx The HTTP request context
 * @returns {Void}
 */
module.exports.UPGRADE = function (ws, ctx) {
  // Using the websocket's address as the current clientId
  // TODO: Figure out the right thing to do here
  // const uid = ws.clientId
  const uid = 'uid'
  const onError = err => err != null && ctx.log.error(err)
  const onOrder = order => order.uid === uid && ws.send(order, onError)

  ctx.orderbooks
    .on('error', onError)
    .on('created', onOrder)
    .on('opened', onOrder)
    .on('closed', onOrder)
    .on('match', (makerOrder, takerOrder) => {
      if (makerOrder.uid !== uid && takerOrder.uid !== uid) return

      ctx.swaps.fromOrders(makerOrder, takerOrder)
        .then(swap => ws.send(swap))
        .catch(err => ws.send(Error(`swap creation failed: ${err.message}!`)))
    })

  ctx.swaps
    .on('error', onError)
    .on('opened', swap => swap.isParty(uid) && ws.send(swap))
    .on('committed', swap => swap.isParty(uid) && ws.send(swap))
}
