/**
 * @file Behavioral specification for the Store
 */

const { expect } = require('chai')
const Store = require('../../../lib/core/store')

describe('Store', function () {
  describe('Instantiation', function () {
    it('must instantiate a store with reasonable defaults', function () {
      let store = null

      expect(() => { store = new Store() }).to.not.throw()
      expect(store).to.be.an.instanceof(Store)
    })
  })

  describe('Operation', function () {
    let store

    before(function () {
      return new Store()
        .once('open', instance => { store = instance })
        .open()
    })

    after(function () {
      return store
        .once('close', () => { store = null })
        .close()
    })

    describe('Expected', function () {
      it('must store new data', function () {
        const args = ['namespace', 'key', { foo: 'bar', bar: 'baz' }]

        store.once('put', (namespace, key, newData, oldData) => {
          expect(namespace).to.be.a('string').that.equals(args[0])
          expect(key).to.be.a('string').that.equals(args[1])
          expect(newData).to.be.an('object').that.deep.equals(args[2])
          expect(oldData).to.equal(undefined)
        })

        return store.put(...args)
          .then(oldData => {
            expect(oldData).to.equal(undefined)
          })
      })

      it('must retrieve previously stored data', function () {
        const args = ['namespace', 'key']
        const expectedData = { foo: 'bar', bar: 'baz' }

        store.once('get', (namespace, key, data) => {
          expect(namespace).to.be.a('string').that.equals(args[0])
          expect(key).to.be.a('string').that.equals(args[1])
          expect(data).to.be.an('object').that.deep.equals(expectedData)
        })

        return store.get(...args)
          .then(data => {
            expect(data).to.be.an('object').that.deep.equals(expectedData)
          })
      })

      it('must update previously stored data, returning old data', function () {
        const args = ['namespace', 'key', { bar: 'baz', baz: 'foo' }]
        const expectedData = { foo: 'bar', bar: 'baz' }

        store.once('put', (namespace, key, newData, oldData) => {
          expect(namespace).to.be.a('string').that.equals(args[0])
          expect(key).to.be.a('string').that.equals(args[1])
          expect(newData).to.be.an('object').that.deep.equals(args[2])
          expect(oldData).to.be.an('object').that.deep.equals(expectedData)
        })

        return store.put(...args)
          .then(data => {
            expect(data).to.be.an('object').that.deep.equals(expectedData)
          })
      })

      it('must retrieve previously updated data', function () {
        const args = ['namespace', 'key']
        const expectedData = { bar: 'baz', baz: 'foo' }

        store.once('get', (namespace, key, data) => {
          expect(namespace).to.be.a('string').that.equals(args[0])
          expect(key).to.be.a('string').that.equals(args[1])
          expect(data).to.be.an('object').that.deep.equals(expectedData)
        })

        return store.get(...args)
          .then(data => {
            expect(data).to.be.an('object').that.deep.equals(expectedData)
          })
      })

      it('must delete existing data', function () {
        const args = ['namespace', 'key']
        const expectedData = { bar: 'baz', baz: 'foo' }

        store.once('del', (namespace, key, data) => {
          expect(namespace).to.be.a('string').that.equals(args[0])
          expect(key).to.be.a('string').that.equals(args[1])
          expect(data).to.be.an('object').that.deep.equals(expectedData)
        })

        return store.del(...args)
          .then(data => {
            expect(data).to.be.an('object').that.deep.equals(expectedData)
          })
      })
    })

    describe('Error Handling', function () {
      it('must error out retrieving non-existent data', function () {
        const args = ['namespace', 'key']

        store.once('get', (namespace, key, data) => {
          expect(namespace).to.be.a('string').that.equals(args[0])
          expect(key).to.be.a('string').that.equals(args[1])
          expect(data).to.equal(undefined)
        })

        return store.get(...args)
          .then(data => {
            console.error('unexpectedly got data', data)
            throw new Error('unexpectedly retrieved non-existent data!')
          })
          .catch(err => {
            expect(err).to.be.an.instanceof(Error)
            expect(err.message).to.be.a('string').that.equals('not found')
          })
      })

      it('must error out deleting non-existent data', function () {
        const args = ['namespace', 'key']

        store.once('del', (namespace, key, data) => {
          expect(namespace).to.be.a('string').that.equals(args[0])
          expect(key).to.be.a('string').that.equals(args[1])
          expect(data).to.equal(undefined)
        })

        return store.del(...args)
          .then(data => {
            console.error('unexpectedly got data', data)
            throw new Error('unexpectedly deleted non-existent data!')
          })
          .catch(err => {
            expect(err).to.be.an.instanceof(Error)
            expect(err.message).to.be.a('string').that.equals('not found')
          })
      })
    })
  })
})
