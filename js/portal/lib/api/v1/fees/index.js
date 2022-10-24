/**
 * @file Bitcoin transaction fee predictions in JSON format using Earn.com
 */

const https = require('https')

/**
 * Retrieves fee-information using the Bitcoin Fees Developer API from Earn.com
 * @param {HttpRequest} req The incoming HTTP request
 * @param {HttpResponse} res The outgoing HTTP response
 * @returns {Void}
 */
module.exports = function (req, res) {
  const { pathname } = req.parsedUrl

  // The remote API only has 2 endpoints; all others are invalid
  if (!pathname.endsWith('/recommended') && !pathname.endsWith('/list')) {
    res.statusCode = 404
    return res.end()
  }

  https.request({ hostname: 'bitcoinfees.earn.com', path: pathname })
    .once('error', err => res.destroyed || res.destroy(err))
    .once('response', proxyRes => {
      res.statusCode = proxyRes.statusCode

      for (const header in proxyRes.headers) {
        res.setHeader(header, proxyRes.headers[header])
      }

      proxyRes
        .once('error', err => res.destroyed || res.destroy(err))
        .pipe(res)
        .once('error', err => proxyRes.destroyed || proxyRes.destroy(err))
    })
    .end()
}
