/**
 * @file Store implementation for node.js
 */

const { BaseClass } = require('@portaldefi/core')

/**
 * A weak-map storing private data for each instance of the class
 * @type {WeakMap}
 */
const INSTANCES = new WeakMap()

/**
 * Store implementation for the node.js
 * @type {Store}
 */
module.exports = class Store extends BaseClass {
  constructor (props) {
    super()

    INSTANCES.set(this, Object.seal({
      namespaces: {}
    }))

    Object.seal(this)
  }

  /**
   * Returns whether or not the store is open
   * @returns {Boolean}
   */
  get isOpen () {
    return null
  }

  /**
   * Returns the JSON representation of this instance
   * @returns {Object}
   */
  toJSON () {
    return {
      '@type': this.constructor.name
    }
  }

  /**
   * Connects to the store.
   * @returns {Promise<Void>}
   */
  open () {
    this.emit('open', this)
    return Promise.resolve(this)
  }

  /**
   * Reads data from the store
   * @param {String} namespace The namespace of the data
   * @param {String} key The unique identifier of the data
   * @returns {Promise<Object>}
   */
  get (namespace, key) {
    const instance = INSTANCES.get(this)
    const namespaceMap = instance.namespaces[namespace]

    if (namespaceMap != null && namespaceMap.has(key)) {
      const data = Object.assign({}, namespaceMap.get(key))
      this.emit('get', namespace, key, data)
      return Promise.resolve(data)
    } else {
      this.emit('get', namespace, key)
      return Promise.reject(new Error('not found'))
    }
  }

  /**
   * Writes data to the store
   * @param {String} namespace The namespace of the data
   * @param {String} key The unique identifier of the data
   * @param {Object} data The data to be stored
   * @returns {Promise<Object>} The previously stored data, if any
   */
  put (namespace, key, data) {
    const instance = INSTANCES.get(this)
    const namespaceMap = instance.namespaces[namespace] || new Map()
    instance.namespaces[namespace] = namespaceMap

    const oldData = namespaceMap.get(key)
    const newData = Object.freeze(Object.assign({}, data))
    namespaceMap.set(key, newData)

    this.emit('put', namespace, key, newData, oldData)
    return Promise.resolve(oldData)
  }

  update (namespace, key, modifier) {
    const instance = INSTANCES.get(this)
    const namespaceMap = instance.namespaces[namespace]

    if (namespaceMap != null && namespaceMap.has(key)) {
      const data = Object.assign({}, namespaceMap.get(key))
      this.emit('get', namespace, key, data)
      return Promise.resolve(data)
    } else {
      this.emit('get', namespace, key)
      return Promise.reject(new Error('not found'))
    }
  }

  /**
   * Deletes data from the store
   * @param {String} namespace The namespace of the data
   * @param {String} key The unique identifier of the data
   * @returns {Promise<Void>}
   */
  del (namespace, key) {
    const instance = INSTANCES.get(this)
    const namespaceMap = instance.namespaces[namespace]

    if (namespaceMap.has(key)) {
      const data = namespaceMap.get(key)
      namespaceMap.delete(key)
      this.emit('del', namespace, key, data)
      return Promise.resolve(data)
    } else {
      this.emit('del', namespace, key)
      return Promise.reject(new Error('not found'))
    }
  }

  /**
   * Closes the connection to the server
   * @returns {Promise<Void>}
   */
  close () {
    this.emit('close', this)
    return Promise.resolve()
  }
}
