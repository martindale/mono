/**
 * @file Specification for using the Bitcoin Fees Prediction API
 */

const { expect } = require('chai')

/**
 * The Bitcoin Fees Prediction API is currently backed by Earn.com's API.
 */
describe('Bitcoin Fees Prediction', function () {
  describe('Expected Cases', function () {
    it('must return the recommended transaction fees', function () {
      const { client } = this.test.ctx

      return client._request({ path: '/api/v1/fees/recommended' })
        .then(json => {
          expect(json).to.be.an('object')

          expect(json).to.have.property('fastestFee')
          expect(json.fastestFee).to.be.a('number')

          expect(json).to.have.property('halfHourFee')
          expect(json.halfHourFee).to.be.a('number')

          expect(json).to.have.property('hourFee')
          expect(json.hourFee).to.be.a('number')
        })
    })

    it('must return the transaction fees summary', function () {
      const { client } = this.test.ctx

      return client._request({ path: '/api/v1/fees/list' })
        .then(json => {
          expect(json).to.be.an('object')

          expect(json).to.have.property('fees')
          expect(json.fees).to.be.an('array')

          for (const fee of json.fees) {
            expect(fee).to.be.an('object')

            expect(fee).to.have.property('minFee').that.is.a('number')
            expect(fee).to.have.property('maxFee').that.is.a('number')
            expect(fee).to.have.property('dayCount').that.is.a('number')
            expect(fee).to.have.property('memCount').that.is.a('number')
            expect(fee).to.have.property('minDelay').that.is.a('number')
            expect(fee).to.have.property('maxDelay').that.is.a('number')
            expect(fee).to.have.property('minMinutes').that.is.a('number')
            expect(fee).to.have.property('maxMinutes').that.is.a('number')
          }
        })
    })
  })
})
