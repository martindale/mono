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
  const { log, orderbooks } = ctx
  // Using the websocket's address as the current clientId
  // TODO: Figure out the right thing to do here
  // const uid = ws.clientId
  const uid = 'uid'
  const onError = err => err != null && log.error(err)
  const onOrder = order => order.uid === uid && ws.send(order, onError)

  orderbooks
    .on('error', onError)
    .on('created', onOrder)
    .on('opened', onOrder)
    .on('closed', onOrder)
    .on('match', (maker, taker) => {
      if (maker.uid !== uid && taker.uid !== uid) return
      ws.send({
        order: maker.uid === uid ? maker : taker,
        match: taker.uid === uid ? taker : maker
      }, onError)
    })
}
