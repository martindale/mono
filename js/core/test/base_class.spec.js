/**
 * @file Behavioral specification for the base class
 */

const BaseClass = require('../lib/base_class')
const { expect } = require('chai')

describe('Base Class', function () {
  describe('Instantiation', function () {
    it('must throw an error if instantiated directly', function () {
      expect(() => new BaseClass()).to.throw('cannot instantiate directly!')
    })
  })

  describe('Operation', function () {
    const Events = new Set(['knownEvent'])

    class SubClass extends BaseClass {
      static get Events () {
        return Events
      }

      fireEvent () {
        return this.emit('knownEvent', 'foo', 'bar', 'baz')
      }
    }

    function validateEvent (...args) {
      expect(args).to.be.an('array').with.length(3)
      expect(args[0]).to.equal('foo')
      expect(args[1]).to.equal('bar')
      expect(args[2]).to.equal('baz')
    }

    let subclass = null

    before(function () {
      subclass = new SubClass()
    })

    after(function () {
      subclass = null
    })

    it('must fire an event exactly once', function () {
      let result = null

      subclass.once('knownEvent', validateEvent)

      expect(() => { result = subclass.fireEvent() }).to.not.throw()
      expect(result).to.equal(true)

      expect(() => { result = subclass.fireEvent() }).to.not.throw()
      expect(result).to.equal(false)
    })

    it('must fire event as over and over again', function () {
      let result = null

      subclass.on('knownEvent', validateEvent)

      expect(() => { result = subclass.fireEvent() }).to.not.throw()
      expect(result).to.equal(true)

      expect(() => { result = subclass.fireEvent() }).to.not.throw()
      expect(result).to.equal(true)
    })

    it('must remove an event handler correctly', function () {
      let result = null

      subclass.off('knownEvent', validateEvent)

      expect(() => { result = subclass.fireEvent() }).to.not.throw()
      expect(result).to.equal(false)
    })
  })
})
