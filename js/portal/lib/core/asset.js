/**
 * @file Defines an asset
 */

/**
 * Defines an asset
 * @type {Asset}
 */
module.exports = class Asset {
  constructor (props) {
    if (props == null) {
      throw new Error('instantiated without arguments!')
    } else if (props.name == null) {
      throw new Error('instantiated without name!')
    } else if (props.symbol == null) {
      throw new Error('instantiated without symbol!')
    }

    this.name = props.name
    this.symbol = props.symbol.toUpperCase()

    Object.freeze(this)
  }
}
