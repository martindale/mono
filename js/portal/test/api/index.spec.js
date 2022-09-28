/**
 * @file Client/Server Interface Specification
 */

const Client = require('../../lib/core/client')
const Server = require('../../lib/core/server')

before('Initialize client/server', function () {
  return new Server()
    .once('start', instance => {
      this.server = instance
      this.client = new Client(instance)
    })
    .start()
})

after('Destroy client/server', function () {
  this.server
    .once('stop', instance => {
      this.server = null
      this.client = null
    })
    .stop()
})
