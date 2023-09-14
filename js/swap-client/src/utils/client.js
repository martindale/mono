/**
 * @file An HTTP client implementation
 */

'use strict'

import { Buffer } from 'buffer'
import { log } from './helpers'
import { Sdk } from '@portaldefi/sdk'

/**
  * Exports an implementation of a client
  * @type {Client}
  */
export default class Client extends Sdk {
  /**
    * Creates a new instance of Client
    * @param {Object} props Properties of the client
    * @param {String} props.id The unique name of the client
    * @param {String} [props.hostname='localhost'] The hostname of the Portal server
    * @param {Number} [props.port=80] The port of the Portal server
    * @param {String} [props.pathname='/api/v1/updates'] The path to the updates channel
    * @param {Object} [props.credentials] Credentials maintained by the client
    */
  constructor (props) {
    super({
      ...props,
      apiVersion: 1
    })

    Object.seal(this)
  }

  /**
   * Create the required state for a BTCORD atomic swap
   * @param {body|Object} swap The swap to open
   * @returns {Swap}
   */
  swapOpenV2 (body) {
    return this._request({ method: 'PUT', path: '/api/v2/swap/submarine' }, body)
  }
  // getBalance (opts) {
  //   return this._request('/api/v1/channel', { method: 'POST' }, { opts })
  // }

  /**
   * Completes the BTCORD atomic swap
   * @param {Body|Object} body The swap to commit
   * @returns {Promise<Void>}
   */
  swapCommitV2 (body) {
    return this._request({ method: 'POST', path: '/api/v2/swap/submarine' }, body)
  }

  /**
    * Handles incoming websocket messages
    * @param {Buffer|Object} msg The message received over the websocket
    * @returns {Void}
    */
  _onMessage (msg) {
    const dat = JSON.parse(msg.data)
    this.emit(dat.status, dat)

    /* try {
      arg = JSON.parse(msg.data)
      event = (arg['@type'] != null && arg.status != null)
         ? `${arg['@type'].toLowerCase()}.${arg.status}`
         : 'message'
    } catch (err) {
      event = 'error'
      arg = err
    } finally {
      this.emit('log', 'info', event, arg)
      this.emit(event, arg)
    } */
  }
}
