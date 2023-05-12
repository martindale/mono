/**
 * @file Implements an object store using LevelDB
 */

const { EventEmitter } = require('events')
const { Level } = require('level')
const { join } = require('path')

/**
 * A weak-map storing private data for each instance of the class
 * @type {WeakMap}
 */
const INSTANCES = new WeakMap()

/**
 * An implementation of a object store using LevelDB
 * @type {LevelStore}
 */
module.exports = class LevelStore extends EventEmitter {
  constructor (props) {
    super()

    props = Object.assign({
      name: 'default',
      location: '.'
    }, props)

    const location = join(props.location, props.name)
    const db = new Level(location)
    const namespaces = new Map([
      ['orderbooks', db.sublevel('orderbooks')],
      ['swaps', db.sublevel('swaps')]
    ])
    INSTANCES.set(this, Object.seal({ db, location, namespaces }))

    Object.seal(this)
  }

  /**
   * Returns the path to the directory where the leveldb data is stored
   * @returns {String}
   */
  get location () {
    return INSTANCES.get(this).location
  }

  /**
   * Returns the list of namespaces in the store
   * @returns {String[]}
   */
  get namespaces () {
    return INSTANCES.get(this).namespaces.keys()
  }

  /**
   * Opens the store, allocating necessary resources
   * @returns {Promise<Store>}
   */
  open () {
    return new Promise((resolve, reject) => {
      const { db } = INSTANCES.get(this)
      const onOpen = () => {
        this.emit('open', this)
        resolve(this)
      }

      (db.status !== 'open')
        ? db.open(err => err != null ? reject(err) : onOpen())
        : onOpen()
    })
  }

  /**
   * Writes data to the store
   * @param {String} namespace The namespace of the data
   * @param {String} key The unique identifier of the data
   * @param {Object} data The data to be stored
   * @returns {Promise<Void>}
   */
  put (namespace, key, data) {
    const { namespaces } = INSTANCES.get(this)
    if (!namespaces.has(namespace)) {
      return Promise.reject(new Error(`${namespace} not found!`))
    }

    const sublevel = namespaces.get(namespace)
    return sublevel.put(key, JSON.stringify(data))
  }

  /**
   * Reads data from the store
   * @param {String} namespace The namespace of the data
   * @param {String} key The unique identifier of the data
   * @returns {Promise<Object>}
   */
  get (namespace, key) {
    const { namespaces } = INSTANCES.get(this)
    if (!namespaces.has(namespace)) {
      return Promise.reject(new Error(`${namespace} not found!`))
    }

    const sublevel = namespaces.get(namespace)
    return sublevel.get(key)
      .then(data => JSON.parse(data))
  }

  /**
   * Updates existing data in the store
   * @param {String} namespace The namespace of the data
   * @param {String} key The unique identifier of the data
   * @param {[type]} modifier  [description]
   * @returns {Promise<Object>} The previously stored data, if any
   */
  update (namespace, key, modifier) {
    const { namespaces } = INSTANCES.get(this)
    if (!namespaces.has(namespace)) {
      return Promise.reject(new Error(`${namespace} not found!`))
    }

    const sublevel = namespaces.get(namespace)
    return sublevel.get(key)
      .then(data => JSON.parse(data))
      .then(data => modifier(data))
      .then(data => sublevel.put(key, JSON.stringify(data)))
  }

  /**
   * Deletes data from the store
   * @param {String} namespace The namespace of the data
   * @param {String} key The unique identifier of the data
   * @returns {Promise<Void>}
   */
  del (namespace, key) {
    const { namespaces } = INSTANCES.get(this)
    if (!namespaces.has(namespace)) {
      return Promise.reject(new Error(`${namespace} not found!`))
    }

    const sublevel = namespaces.get(namespace)
    return sublevel.del(key)
  }

  /**
   * Closes the store, after deallocating any previously allocated resources
   * @returns {Promise<Void>}
   */
  close () {
    return new Promise((resolve, reject) => {
      const { db } = INSTANCES.get(this)

      if (db.status === 'closed') {
        this.emit('close', this)
        resolve(this)
      } else {
        db.close(err => {
          if (err != null) {
            reject(err)
          } else {
            this.emit('close', this)
            resolve(this)
          }
        })
      }
    })
  }
}
