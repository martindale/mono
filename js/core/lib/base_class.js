/**
 * @file The base class for all other classes
 */

/**
 * A weak-map storing private data for each instance of the class
 * @type {WeakMap}
 */
const INSTANCES = new WeakMap()

/**
 * A base class for all other classes/types.
 *
 * This class provides the following abstractions:
 * - EventEmitter: through `.emit()`, `.on()`, `.once()`, and `.off()`
 * - Logger: through `.debug()`, `.info()`, `.warn()`, and `.error()`
 *
 * Additionally, it provides methods for logging the internal state of the
 * instances of the class, through the `.toJSON()` method.
 *
 * @type {BaseClass}
 */
module.exports = class BaseClass {
  /**
   * Constructs a new instance of the class
   */
  constructor () {
    if (this.constructor === BaseClass) {
      throw Error('cannot instantiate directly!')
    }

    INSTANCES.set(this, {
      events: new Map()
    })
  }

  /**
   * Returns the current state of the instance
   * @type {String}
   */
  [Symbol.for('nodejs.util.inspect.custom')] () {
    return this.toJSON()
  }

  /**
   * Retuns the JSON representation of the instance
   * @returns {Object}
   */
  toJSON () {
    return {}
  }

  /**
   * Emits an event
   * @param {String} eventName The name of the event
   * @param {*} args Arguments supplied to the event handler(s)
   * @returns {Boolean} true, if the event was handled; otherwise false
   */
  emit (eventName, ...args) {
    const { events } = INSTANCES.get(this)
    if (!events.has(eventName)) return false

    const handlers = events.get(eventName)
    const result = handlers.size !== 0

    for (const handler of handlers) {
      handler.call(this, ...args)
    }

    return result
  }

  /**
   * Executes the handler whenever the event fires
   * @param {String} eventName The name of the event
   * @param {Function} handler The function to execute when the event fires
   * @returns {BaseClass}
   */
  on (eventName, handler) {
    const { events } = INSTANCES.get(this)
    events.has(eventName) || events.set(eventName, new Set())

    const handlers = events.get(eventName)
    handlers.add(handler)

    return this
  }

  /**
   * Executes the handler exactly once when the event fires
   * @param {String} eventName The name of the event
   * @param {Function} handler The function to execute when the event fires
   * @returns {BaseClass}
   */
  once (eventName, handler) {
    const { events } = INSTANCES.get(this)
    events.has(eventName) || events.set(eventName, new Set())

    const handlers = events.get(eventName)
    const wrapper = function (...args) {
      handlers.delete(wrapper)
      handler(...args)
    }
    handlers.add(wrapper)

    return this
  }

  /**
   * Removes the handler from the list of handlers for the event
   * @param {String} eventName The name of the event
   * @param {Function} handler The function to remove
   * @returns {BaseClass}
   */
  off (eventName, handler) {
    const { events } = INSTANCES.get(this)
    events.has(eventName) || events.set(eventName, new Set())

    const handlers = events.get(eventName)
    handlers.delete(handler)

    return this
  }

  /**
   * Emits a debug log event
   * @param {String} eventName The name of the event that triggered the log
   * @param {*} args Arguments supplied to the event handler(s)
   * @returns {Boolean} true, if the event was handled; otherwise false
   */
  debug (eventName, ...args) {
    this.emit('log', 'debug', eventName, ...args)
  }

  /**
   * Emits an info log event
   * @param {String} eventName The name of the event that triggered the log
   * @param {*} args Arguments supplied to the event handler(s)
   * @returns {Boolean} true, if the event was handled; otherwise false
   */
  info (eventName, ...args) {
    this.emit('log', 'info', eventName, ...args)
  }

  /**
   * Emits a warn log event
   * @param {String} eventName The name of the event that triggered the log
   * @param {*} args Arguments supplied to the event handler(s)
   * @returns {Boolean} true, if the event was handled; otherwise false
   */
  warn (eventName, ...args) {
    this.emit('log', 'warn', eventName, ...args)
  }

  /**
   * Emits an error log event
   * @param {String} eventName The name of the event that triggered the log
   * @param {*} args Arguments supplied to the event handler(s)
   * @returns {Boolean} true, if the event was handled; otherwise false
   */
  error (eventName, ...args) {
    this.emit('log', 'error', eventName, ...args)
  }
}
