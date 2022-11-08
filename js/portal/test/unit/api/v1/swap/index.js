/**
 * @file Specification for an Atomic Swap
 */

/**
 * Test suites for testing an Atomic Swap
 *
 * @param {Client} client An instance of the Portal Client
 * The Portal Client instance provides an RPC interface to the functionality
 * exposed by the Portal Server. Use this instance to make calls to the server.
 *
 * @param {Server} server An instance of the Portal Server
 * The Portal Server is an HTTP server that routes requests to one or more
 * endpoints, and serves any static HTTP content.
 */
module.exports = function (client, server) {
  /**
   * As of this writing, this is limited to implementing an atomic swap of
   * assets between two Ethereum (L1) chains, which are being emulated using the
   * Goerli and Ropsten testnets.
   */
  describe('Atomic Swap', function () {
    /**
     * The Engineering Specification describes the various components of the
     * system, their interfaces, and interactions.
     */
    describe('Engineering Specification', function () {
      /**
       * Defines the HTTP interface specification
       *
       * Every HTTP endpoint exposed by the server must have one or more
       * corresponding functions in the client. Using the `client`, and `server`
       * instances provided to the test-suite, each endpoint can be tested for
       * compliance, including error-handling, pathological cases, and any other
       * exceptional code flow.
       */
      describe('Interface Specification', function () {
        describe('Expected Cases', function () {
          it('perform an atomic swap between alice and bob', async function () {
            const { alice, bob } = this.test.ctx
            const swap = getSwapFromOrderMatching()

            const swapAlice = await alice.createSwap(maker, taker)
            // assert client/server state
            const swapBob = await bob.stepOne(maker, taker)
            // assert client/server state

            const swappedAlice = await bob.exchangeSwap(swapBob)
            // assert client/server state
            const swappedBob = await alice.exchangeSwap(swapAlice)
            // assert client/server state

            await alice.commitSwap(swapAlice, swappedBob)
            // assert client/server state
            await bob.stepTwo(swapBob, swappedAlice)
            // assert client/server state
          })

          it('must return funds when one party cancels', function () {
            const { alice, bob } = this.test.ctx
            const { maker, taker } = getMatchedOrderFromSomewhere()

            const swapAlice = await alice.stepOne(maker, taker)
            // assert client/server state
            const swapBob = await bob.stepOne(maker, taker)
            // assert client/server state
            const swappedAlice = await bob.exchangeSwap(swapBob)
            // assert client/server state
            const swappedBob = await alice.exchangeSwap(swapAlice)
            // assert client/server state
            await alice.stepTwo(swapAlice, swappedBob)
            // assert client/server state
            await bob.stepTwo(swapBob, swappedAlice)
            // assert client/server state
          })
        })

        describe('Exceptional Cases', function () {
          it('must have one test case per "Oops!"')
        })
      })

      /**
       * Defines the EVM Smart Contract specification
       *
       * A cross-chain atomic swap between two blockchains is implented as one
       * or more smart contract suites, which work in tandem to enable the
       * magical movement of assets. These specifications verify that the EVM
       * state machine transitions from one valid state to the next.
       */
      describe('Ethereum Smart Contract Specification', function () {
        describe('Expected Cases', function () {
          it('must test the EVM code paths')
        })

        describe('Exceptional Cases', function () {
          it('must never be in a bad/unexpected state')
        })
      })
    })

    /**
     * The Product Specification describes one or more user stories around the
     * features of the product.
     */
    describe('Product Specification', function () {
      describe('Expected Cases', function () {
        it('must contain one or more user stories')
      })

      describe('Exceptional Cases', function () {
        it('must handle all errors gracefully')
      })
    })

    /**
     * The Operational Specification describes developer stories around system
     * usage in various environments.
     */
    describe('Operational Specification', function () {
      describe('Expected Cases', function () {
        it('must have one or more operator stories')
      })

      describe('Exceptional Cases', function () {
        it('must contain stories of woe')
      })
    })
  })
}
