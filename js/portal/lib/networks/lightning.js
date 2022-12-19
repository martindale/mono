/**
 * @file The Lightning network
 */

const Network = require('../core/network')
const ln = require('lightning')
const { createHodlInvoice, subscribeToInvoice, decodePaymentRequest, payViaPaymentRequest, settleHodlInvoice } = require('lightning')


/**
 * Exports an interface to the Lightning blockchain network
 * @type {Lightning}
 */
module.exports = class Lightning extends Network {
  constructor (props) {
    super({
      assets: ['BTC', 'BCH'],
      client: ln
    })
  }

  getCounterpartyInfo (party) {
    return party.swap.getCounterpartyInfo(party)
  }

  async init (party) {
    const leftClientInfo = party.state.left.clientInfo
    const rightClientInfo = party.state.right.clientInfo


    party.state.left.lnd.admin = ln.authenticatedLndGrpc({
      cert: leftClientInfo.cert,
      macaroon: leftClientInfo.adminMacaroon,
      socket: leftClientInfo.socket
    })
    party.state.left.lnd.invoice = ln.authenticatedLndGrpc({
      cert: leftClientInfo.cert,
      macaroon: leftClientInfo.invoiceMacaroon,
      socket: leftClientInfo.socket
    })
    party.state.right.lnd.admin = ln.authenticatedLndGrpc({
      cert: rightClientInfo.cert,
      macaroon: rightClientInfo.adminMacaroon,
      socket: rightClientInfo.socket
    })
    party.state.right.lnd.invoice = ln.authenticatedLndGrpc({
      cert: rightClientInfo.cert,
      macaroon: rightClientInfo.invoiceMacaroon,
      socket: rightClientInfo.socket
    })
  }

  async open (party) {
    await this.init(party)

    if (party.isSecretSeeker) {
      const aliceInvoice1 = party.state.left.lnd.invoice

      aliceInvoice1.id = party.swapHash
      aliceInvoice1.tokens = party.quantity
      const request1 = (await createHodlInvoice(aliceInvoice1)).request
      console.log(`request1: ${request1}`)

      party.publicInfo.left.request = request1
      party.publicInfo.request = request1
    }
    else if (party.isSecretHolder) {
      const carolInvoice2 = party.state.right.lnd.invoice
      const swapHash = party.swapHash
      const quantity = party.quantity

      carolInvoice2.id = swapHash
      carolInvoice2.tokens = quantity
      const request2 = (await createHodlInvoice(carolInvoice2)).request
      console.log(`request2: ${request2}`)

      const subscription = await subscribeToInvoice(carolInvoice2)

      await subscription.on('invoice_updated', async invoice2 => {
        if (invoice2.is_confirmed) {
          console.log('INVOICE in N2 PAID and SETTLED')
        }

        if (!invoice2.is_held) {
          return
        }
        carolInvoice2.secret = party.state.secret
        await settleHodlInvoice(carolInvoice2)
      })
      party.publicInfo.right.request = request2
      party.publicInfo.request = request2
      party.state.right.lnd.subscription = subscription
    }
    else throw new Error("Party must be either Alice or Carol")

  }

  async commit (party) {
    if (party.isSecretSeeker) {
      const aliceInvoice1 = party.state.left.lnd.invoice
      const alice2 = party.state.right.lnd.admin

      const request2 = this.getCounterpartyInfo(party).right.request
      const swapHash = party.swapHash
      const quantity = party.quantity
      const subscription = await subscribeToInvoice(aliceInvoice1)
      await subscription.on('invoice_updated', async invoice1 => {
        if (invoice1.is_confirmed) {
          console.log('INVOICE in N1 PAID and SETTLED')
        }

        if (!invoice1.is_held) {
          return
        }

        alice2.request = request2
        const details2 = await decodePaymentRequest(alice2).catch(reason => console.log(reason))
        if (swapHash !== details2.id) {
          throw new Error('Swap hash does not match payment hash for invoice on network #2')
        }

        const paidInvoice = await payViaPaymentRequest(alice2).catch(reason => console.log(reason))

        aliceInvoice1.secret = paidInvoice.secret
        await settleHodlInvoice(aliceInvoice1)
      })
    }
    else if (party.isSecretHolder) {
      if (!party.swap.isCommitting) {
        throw new Error("The secretHolder party must wait until the secretSeeker has committed")
      }

      const carol1 = party.state.left.lnd.admin
      const swapHash = party.swapHash
      const quantity = party.quantity
      const request1 = this.getCounterpartyInfo(party).left.request

      carol1.request = request1
      const details1 = await decodePaymentRequest(carol1).catch(reason => console.log(reason))
      if (swapHash !== details1.id) {
        throw new Error('Swap hash does not match payment hash for invoice on network #1')
      }

      carol1.request = request1
      await payViaPaymentRequest(carol1).catch(reason => console.log(reason))

    }
    else throw new Error("Party must be either Alice or Carol")
  }
}
