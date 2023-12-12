/**
 * @file The base class for all other classes
 */

/**
 * A weak-map storing private data for each instance of the class
 * @type {WeakMap}
 */
const INSTANCES = new WeakMap()

/**
 * The levels at which information is logged
 * @type {Array}
 */
const LOG_LEVELS = ['debug', 'info', 'warn', 'error']

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
  constructor (props) {
    if (this.constructor === BaseClass) {
      throw Error('cannot instantiate directly!')
    } else if (props != null && typeof props.id !== 'string') {
      throw Error(`expected props.id to be a string; got "${typeof props.id}"!`)
    }

    const id = props && props.id

    INSTANCES.set(this, { id, events: new Map() })

    LOG_LEVELS.forEach(level => {
      this[level] = (id == null)
        ? (event, ...args) => this.emit('log', level, event, ...args)
        : (event, ...args) => this.emit('log', level, `${id}.${event}`, ...args)
    })
  }

  /**
   * Returns the unique identifier of the instance
   * @returns {String}
   */
  get id () {
    return INSTANCES.get(this).id
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
    const obj = { '@type': this.constructor.name }
    if (this.id != null) obj.id = this.id
    return obj
  }

  /**
   * Emits an event
   * @param {String} eventName The name of the event
   * @param {*} args Arguments supplied to the event listener(s)
   * @returns {Boolean} true, if the event was handled; otherwise false
   */
  emit (eventName, ...args) {
    const { events } = INSTANCES.get(this)
    if (!events.has(eventName)) return false

    const listeners = events.get(eventName)
    const result = listeners.size !== 0

    for (const listener of listeners) {
      listener.call(this, ...args)
    }

    return result
  }

  /**
   * Executes the listener whenever the event fires
   * @param {String} eventName The name of the event
   * @param {Function} listener The function to execute when the event fires
   * @returns {BaseClass}
   */
  on (eventName, listener) {
    const { events } = INSTANCES.get(this)

    events.has(eventName) || events.set(eventName, new Set())
    this.emit('newListener', eventName, listener)

    const listeners = events.get(eventName)
    listeners.add(listener)

    return this
  }

  /**
   * Executes the listener exactly once when the event fires
   * @param {String} eventName The name of the event
   * @param {Function} listener The function to execute when the event fires
   * @returns {BaseClass}
   */
  once (eventName, listener) {
    const { events } = INSTANCES.get(this)

    events.has(eventName) || events.set(eventName, new Set())
    this.emit('newListener', eventName, listener)

    const listeners = events.get(eventName)
    const wrapper = function (...args) {
      listeners.delete(wrapper)
      if (listeners.size === 0) events.delete(eventName)
      listener(...args)
    }
    listeners.add(wrapper)

    return this
  }

  /**
   * Removes the listener from the list of listeners for the event
   * @param {String} eventName The name of the event
   * @param {Function} listener The function to remove
   * @returns {BaseClass}
   */
  off (eventName, listener) {
    const { events } = INSTANCES.get(this)

    if (events.has(eventName)) {
      const listeners = events.get(eventName)
      listeners.delete(listener)
      if (listeners.size === 0) events.delete(eventName)
      this.emit('removeListener', eventName, listener)
    }

    return this
  }

  /**
   * Executes the listener whenever the event fires; alias of on()
   * @param {String} eventName The name of the event
   * @param {Function} listener The function to execute when the event fires
   * @returns {BaseClass}
   */
  addListener (eventName, listener) {
    return this.on(eventName, listener)
  }

  /**
   * Removes all listeners
   * @param {String} eventName The name of the event
   * @returns {BaseClass}
   */
  removeAllListeners (eventName) {
    const { events } = INSTANCES.get(this)

    if (events.has(eventName)) {
      const listeners = events.get(eventName)
      events.delete(eventName)

      for (const listener of listeners) {
        this.emit('removeListener', eventName, listener)
      }
    }

    return this
  }

  /**
   * Removes a listener for the event; alias of off()
   * @param {String} eventName The name of the event
   * @param {Function} listener The function to remove
   * @returns {BaseClass}
   */
  removeListener (eventName, listener) {
    return this.off(eventName, listener)
  }

  /**
   * Returns an array listing the events that have listeners
   * @returns {Array<String>}
   */
  eventNames () {
    const { events } = INSTANCES.get(this)
    return Array.from(events.keys())
  }

  /**
   * Returns an array of listeners for the specified event
   *
   * This is subtly different from `EventEmitter` in that it returns listeners
   * wrapped by the `.once()` method.
   * @returns {Array<Function>}
   */
  listeners (eventName) {
    const { events } = INSTANCES.get(this)
    return events.has(eventName)
      ? Array.from(events.get(eventName))
      : []
  }
}
