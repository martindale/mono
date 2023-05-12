/**
 * @file Behavioral spec for the LevelDB store
 */

const { expect } = require('chai')
const { tmpdir } = require('os')
const Store = require('../../../lib/stores/leveldb')

describe('Store - LevelDB', function () {
  const PROPS = { name: 'test', location: tmpdir() }
  let store = null

  it('must not throw when instantiated', function () {
    expect(() => { store = new Store(PROPS) }).to.not.throw()
    expect(store).to.not.equal(null)
    expect(store).to.be.an.instanceof(Store)
    expect(store.location).to.be.a('string').that.equals(`${tmpdir()}/test`)
  })

  it('must open the database successfully', function () {
    return store.open()
  })

  it('must put a value into the store', function () {
    return store.put('orderbooks', 'foo', { foo: 'bar' })
  })

  it('must get a value from the store', function () {
    return store.get('orderbooks', 'foo')
      .then(data => expect(data).to.an('object').that.deep.equals({
        foo: 'bar'
      }))
  })

  it('must update a value in the store', function () {
    return store.update('orderbooks', 'foo', obj => Promise.resolve({
      ...obj,
      bar: 'baz'
    }))
  })

  it('must delete the value from the store', function () {
    return store.del('orderbooks', 'foo')
  })

  it('must not get the deleted value from the store', function () {
    return store.get('orderbooks', 'foo')
      .catch(err => expect(err).to.an.instanceof(Error))
  })

  it('must close the database successfully', function () {
    return store.close()
  })
})
