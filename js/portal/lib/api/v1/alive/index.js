/**
 * @file Alive endpoint used to check whether or not the server is facing serious problems.
 */

/**
 * Send back a 200 response containing {"alive":true} if the service
 * is alive.
 */
module.exports = function (req, res) {
  res.send({ alive: true })
}
