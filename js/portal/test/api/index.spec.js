/**
 * @file
 */

const Client = require('../../lib/core/client')
const Server = require('../../lib/core/server')
const Api = require('../../lib/core/api')()

describe('API Resources', function () {
  let client, server

  beforeEach(function () {
    return new Server()
      .once('start', instance => {
        server = instance
        client = new Client()
      })
      .start()
  })

  afterEach(function () {
    return server
      .once('stop', instance => {
        server = null
        client = null
      })
      .stop()
  })

  Object.keys(Api).forEach(endpoint => require(`..${endpoint}`)(client, server))
})
