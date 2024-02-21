/**
 * @file Testing environment for the app
 */

const pkg = require('../package.json')
const { Parcel } = require('@parcel/core')
const Peer = require('@portaldefi/peer')
const { expect } = require('chai')
const { join } = require('path')

/**
 * Logging helper for when it is needed
 * @type {Function}
 */
const log = process.argv.includes('--debug')
  ? console.error
  : function () {}

before(async function () {
  const bundler = new Parcel({
    entries: join(__dirname, '..', pkg.source),
    defaultConfig: '@parcel/config-default'
  })
  this.watcher = await bundler.watch((err, event) => {
    if (err) {
      console.error('error', 'bundler.build', {
        '@type': 'Parcel',
        status: 'errored',
        error: err
      })
    } else if (event.type === 'buildFailure') {
      console.error('error', 'bundler.build', {
        '@type': 'Parcel',
        status: 'failed',
        error: event.diagnostics
      })
    } else if (event.type === 'buildSuccess') {
      console.error('info', 'bundler.build', {
        '@type': 'Parcel',
        status: 'success',
        buildTime: event.buildTime
      })
    }
  })

  this.peer = new Peer({ root: join(__dirname, '..', 'dist') })
  this.peer.on('log', log)
  await this.peer.start()
})

after(async function () {
  await this.test.ctx.watcher.unsubscribe()
  await this.test.ctx.peer.stop()
})

describe('Test Environment', function () {
  it('must have a peer running and ready for testing', function () {
    expect(this.test.ctx.peer.isListening).to.equal(true)
  })
})
