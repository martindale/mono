/**
 * @file Run the mocha tests in the browser
 */

import Sdk from '../index.js'
import config from '../etc/config.dev'

describe('Portal SDK', function () {
  let sdk = null

  before(async function () {
    const credentials = {}
    const props = Object.assign({}, config, {
      credentials,
      network: Object.assign({}, config.network, { id: 'alice' })
    })
    sdk = new Sdk(props)
    await sdk.start()
  })

  it('must be connected and ready for subsequent tests', function () {
    expect(sdk).to.be.an.instanceof(Sdk)
    expect(sdk.isConnected).to.equal(true)
  })

  after(async function () {
    await sdk.stop()
    sdk = null
  })
})
