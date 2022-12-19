/**
 * @file Defines a user
 */

const { EventEmitter } = require('events')

/**
 * Defines a user
 * @type {User}
 */
module.exports = class User extends EventEmitter {
  constructor (props) {
    if (props == null) {
      throw Error('no properties specified!')
    } else if (props.uid == null) {
      throw Error('no user identifier specified!')
    }

    super()

    this.uid = props.uid
  }
}
