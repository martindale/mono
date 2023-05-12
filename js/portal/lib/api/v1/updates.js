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
  const onError = err => err != null && ctx.log.error(err)
  const onOrder = order => order.uid === ws.user && ws.send(order, onError)
  const onSwap = swap => swap.isParty({ id: ws.user }) && ws.send(swap)

  ctx.orderbooks
    .on('error', onError)
    .on('created', onOrder)
    .on('opened', onOrder)
    .on('closed', onOrder)

  ctx.swaps
    .on('error', onError)
    .on('created', onSwap)
    .on('opening', onSwap)
    .on('opened', onSwap)
    .on('committing', onSwap)
    .on('committed', onSwap)

  // unregister all event handlers when the websocket closes
  ws.on('close', () => {
    ctx.orderbooks
      .off('error', onError)
      .off('created', onOrder)
      .off('opened', onOrder)
      .off('closed', onOrder)

    ctx.swaps
      .off('error', onError)
      .off('created', onSwap)
      .off('opening', onSwap)
      .off('opened', onSwap)
      .off('committing', onSwap)
      .off('committed', onSwap)
  })
}
